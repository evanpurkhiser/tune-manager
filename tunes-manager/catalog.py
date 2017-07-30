import hashlib
import os
import sqlalchemy
import sqlalchemy.orm.exc
import watchdog.observers

import db
import mediafile
import utils.file


class MetadataIndexer(object):
    """Sync file libray to a database backed catalog
    """
    def __init__(self, library_path, session):
        # Normalize library path
        library_path = os.path.realpath(library_path)

        self.library_path = library_path
        self.session = session

    def reindex(self):
        """Reindex new or changed tracks.
        """
        files = utils.file.collect_files([self.library_path], recursive=True)

        # Query {file_path: mtime} mappings
        query  = self.session.query(db.Track.file_path, db.Track.mtime)
        mtimes = {t.file_path: t.mtime for t in query.all()}

        for path in files:
            path = os.path.realpath(path)
            last_mtime = os.path.getmtime(path)

            short_path = utils.file.track_path(path, self.library_path)

            # Track is unchanged
            if short_path in mtimes and mtimes[short_path] == last_mtime:
                continue

            self.add_or_update(path)

        self.session.commit()

    def watch_collection(self):
        """Watch all files for changes in the collection.
        """
        handler = _CatalogWatchHandler(self)

        watcher = watchdog.observers.Observer()
        watcher.schedule(handler, self.library_path, recursive=True)
        watcher.start()

    def add_or_update(self, path):
        """Add or update a libray track in the catalog.

        It's important to note, that if a track has both changed paths and
        changed metadata, the path and file checksum will no longer match, thus
        the trac will be added as a *new* item in the catalog.
        """
        media = mediafile.MediaFile(path)
        track = mediafile_to_track(media, self.library_path)

        # Get ID of the track with matching path or MD5
        track_filter = sqlalchemy.or_(
            db.Track.file_path == track.file_path,
            db.Track.file_hash == track.file_hash
        )

        try:
            old_track = self.session.query(db.Track).filter(track_filter).one()
            track.id = old_track.id
        except sqlalchemy.orm.exc.NoResultFound:
            pass

        self.session.merge(track)


class _CatalogWatchHandler(watchdog.events.FileSystemEventHandler):
    """Watchdog catalog file change handler
    """
    def __init__(self, indexer):
        self.indexer = indexer

    def dispatch(self, event):
        super().dispatch(event)
        self.indexer.session.commit()

    def on_created(self, event):
        media = mediafile.MediaFile(event.src_path)
        track = mediafile_to_track(media, self.indexer.library_path)

        self.indexersession.add(track)

    def on_modified(self, event):
        self.indexer.add_or_update(event.src_path)

    def on_moved(self, event):
        library_path = self.indexer.library_path

        src = utils.file.track_path(event.src_path, library_path)
        dst = utils.file.track_path(event.dest_path, library_path)

        track = self.session.query(db.Track).filter(db.Track.file_path == src)

        track.file_path = dst


def mediafile_to_track(media, library_path):
    """Converts a MediaFile object into a Track object
    """
    path = media.file_path

    with open(path, 'rb') as track_file:
        file_hash = hashlib.md5(track_file.read()).hexdigest()

    # Compute artwork hash
    artwork  = media.mg_file.tags.getall('APIC')
    art_hash = None

    if len(artwork) > 0:
        art_hash = hashlib.md5(artwork[0].data).hexdigest()

    track = db.Track()

    track.mtime = os.path.getmtime(path)
    track.file_path = utils.file.track_path(path, library_path)
    track.file_hash = file_hash
    track.artwork_hash = art_hash

    # Columns are gathered as a direct mapping from attributes in the MediaFile
    # object to the columns in the track model.
    for k in (k for k in dir(media) if hasattr(track, k)):
        setattr(track, k, str(getattr(media, k)))

    return track

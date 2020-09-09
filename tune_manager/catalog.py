import asyncio
from asyncio.exceptions import CancelledError
import hashlib
import os
import logging

import sqlalchemy
import sqlalchemy.orm.exc
import watchdog.observers

from tune_manager import db, mediafile
from tune_manager.utils import file
from tune_manager.utils.watchdog import AsyncHandler


log = logging.getLogger("indexer")


class MetadataIndexer(object):
    """
    Sync file libray to a database backed catalog
    """

    def __init__(self, library_path, artwork_path, db_session, loop=None):
        # Normalize library path
        library_path = os.path.realpath(library_path)

        self.library_path = library_path
        self.db_session = db_session
        self.artwork_path = artwork_path
        self.loop = loop or asyncio.get_event_loop()

    def reindex_sync(self):
        """
        Reindex new or changed tracks.
        """
        files = file.collect_files([self.library_path], recursive=True)

        # Query {file_path: mtime} mappings
        query = self.db_session.query(db.Track.file_path, db.Track.mtime)
        mtimes = {t.file_path: t.mtime for t in query.all()}

        for path in files:
            path = os.path.realpath(path)
            last_mtime = int(os.path.getmtime(path))

            short_path = file.track_path(path, self.library_path)

            # Track is unchanged
            if short_path in mtimes and mtimes[short_path] == last_mtime:
                continue

            try:
                self.add_or_update(path)
                self.db_session.commit()
            except Exception as e:
                log.warn(f"Failed to update {short_path}: {e}")

    async def reindex(self):
        try:
            await self.loop.run_in_executor(None, self.reindex_sync)
        except CancelledError:
            pass

    async def watch_library(self):
        """
        Watch all files for changes in the collection.
        """
        handler = CatalogWatchHandler(self)
        handler = AsyncHandler(self.loop, handler.dispatch)

        # The watchdog observer can take some time to setup as it has to add
        # inode watchers to all files. Set it up in a threaded executor.
        def prepare_watcher():
            observer = watchdog.observers.Observer()
            observer.schedule(handler, self.library_path, recursive=True)

            return observer

        try:
            observer = await self.loop.run_in_executor(None, prepare_watcher)
        except CancelledError:
            pass

        async def file_dispatcher():
            observer.start()
            while True:
                try:
                    await asyncio.sleep(1)
                except CancelledError:
                    break

        self.loop.create_task(file_dispatcher())

    def add_or_update(self, path):
        """
        Add or update a libray track in the catalog.

        It's important to note, that if a track has both changed paths and
        changed metadata, the path and file checksum will no longer match, thus
        the track will be added as a *new* item in the catalog.
        """
        try:
            media = mediafile.MediaFile(path)
        except ValueError as e:
            log.warn(f"File {path} could not be read with error {e}")
            return

        track = mediafile_to_track(media, self.library_path)

        # Update artwork cache
        if track.artwork_hash:
            ensure_artwork_cache(prefix=self.artwork_path, media=media, track=track)

        # Get ID of the track with matching path or MD5
        track_filter = sqlalchemy.or_(
            db.Track.file_path == track.file_path, db.Track.file_hash == track.file_hash
        )

        try:
            old_track = self.db_session.query(db.Track).filter(track_filter).one()
            track.id = old_track.id
        except sqlalchemy.orm.exc.NoResultFound:
            pass

        self.db_session.merge(track)


class CatalogWatchHandler(watchdog.events.FileSystemEventHandler):
    """
    Watchdog catalog file change handler
    """

    def __init__(self, indexer):
        self.indexer = indexer

    async def dispatch(self, event):
        if event.src_path and os.path.isdir(event.src_path):
            return
        super().dispatch(event)
        try:
            self.indexer.db_session.commit()
        except sqlalchemy.exc.IntegrityError:
            log.warn("Integrity error produced when handling file event")

    def on_created(self, event):
        self.indexer.add_or_update(event.src_path)

    def on_modified(self, event):
        self.indexer.add_or_update(event.src_path)

    def on_moved(self, event):
        library_path = self.indexer.library_path

        src = file.track_path(event.src_path, library_path)
        dst = file.track_path(event.dest_path, library_path)

        track = self.indexer.db_session.query(db.Track).filter(
            db.Track.file_path == src
        )

        track.file_path = dst

    def on_deleted(self, event):
        library_path = self.indexer.library_path

        self.indexer.db_session.query(db.Track).filter(
            db.Track.file_path == file.track_path(event.src_path, library_path)
        ).delete()
        self.indexer.db_session.commit()


def mediafile_to_track(media, library_path):
    """
    Converts a MediaFile object into a Track object
    """
    path = media.file_path

    with open(path, "rb") as track_file:
        file_hash = hashlib.md5(track_file.read()).hexdigest()

    # Compute artwork hash
    artwork = media.mg_file.tags.getall("APIC")
    art_hash = None

    if len(artwork) > 0:
        art_hash = hashlib.md5(artwork[0].data).hexdigest()

    track = db.Track()

    # Columns are gathered as a direct mapping from attributes in the MediaFile
    # object to the columns in the track model.
    for k in (k for k in dir(media) if hasattr(track, k)):
        setattr(track, k, str(getattr(media, k)))

    track.mtime = int(os.path.getmtime(path))
    track.file_path = file.track_path(path, library_path)
    track.file_hash = file_hash
    track.artwork_hash = art_hash

    return track


def ensure_artwork_cache(prefix, track, media):
    artwork_path = os.path.join(prefix, track.artwork_hash[0:2], track.artwork_hash)

    if os.path.exists(artwork_path):
        return

    artwork_dir = os.path.dirname(artwork_path)
    if not os.path.exists(artwork_dir):
        os.makedirs(artwork_dir)

    with open(artwork_path, "wb") as file:
        artwork = media.mg_file.tags.getall("APIC")
        file.write(artwork[0].data)

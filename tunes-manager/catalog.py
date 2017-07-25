import hashlib
import itertools
import re
import sqlalchemy

import utils.file
import mediafile
import db

# Create database things
db.init(sqlalchemy.create_engine('sqlite:///database.db'))

print(db.Track)


def mediafile_to_track(mediafile):
    """Converts a MediaFile object into a Track object
    """
    path = mediafile.track_path

    with open(path, 'rb') as track_file:
        file_hash = hashlib.md5(track_file.read()).hexdigest()

    # Compute artwork hash
    artwork  = mediafile.mg_file.tags.getall('APIC')
    art_hash = None

    if len(artwork) > 0:
        art_hash = hashlib.md5(artwork[0].data).hexdigest()

    track = db.Track(file_hash)

    track.file_path = path
    track.file_hash = file_hash
    track.artwork_hash = art_hash

    # Insert metadata into the database
    # Columns are gathered as a direct mapping from attributes in the MediaFile
    # object from the columns in the table.

    keys = [ c.name for c in tracks.c if hasattr(mediafile, c.name) ]
    data = { k: str(getattr(track, k)) for k in keys }

    data
    data['artwork_hash'] = art_hash

    tracks.insert(data).execute()


# Load all metadata into the database
LIBRARY = '/Users/evan/Music/TracksLocal'

files = utils.file.collect_files([LIBRARY], recursive=true)

for track_path  in files:
  mediafile = mediafile.MediaFile(track_path)



  # Compute file hash
  with open(track_path, 'rb') as track_file:
    file_hash = hashlib.md5(track_file.read()).hexdigest()

  # Compute artwork hash
  artwork  = track.mg_file.tags.getall('APIC')
  art_hash = None

  if len(artwork) > 0:
    art_hash = hashlib.md5(artwork[0].data).hexdigest()

  # Insert metadata into the database
  # Columns are gathered as a direct mapping from attributes in the MediaFile
  # object from the columns in the table.
  keys = [ c.name for c in tracks.c if hasattr(track, c.name) ]
  data = { k: str(getattr(track, k)) for k in keys }

  data['file_hash']    = file_hash
  data['artwork_hash'] = art_hash

  tracks.insert(data).execute()


# Replace vs variants
vs_regex = re.compile('[Vv][Ss]\.?')

cols = [
  tracks.c.artist,
  tracks.c.remixer,
  tracks.c.title,
]

col_names = [ c.name for c in cols ]

for t in tracks.select().execute():
  print(t)


  for t in tracks.select().where(or_(*filters)).execute():
    media_file = mediafile.MediaFile(t[tracks.c.file_path])

    for c in col_names:
      val = getattr(media_file, c)

      if not val: continue

      for bad_item in items:
        replaced = val.replace(bad_item, good_item)
        if replaced == val: continue

        confirm = input('{} -> {} ?'.format(val, replaced))
        if confirm != 'y': continue

        setattr(media_file, c, replaced)
        media_file.save()




# EXTRA WORK
# Split artists, titles, and remixer
split_regex = re.compile('(?:,| [Vv][Ss]\.?| &| Ft\.) ')

all_tracks = tracks.select().execute()
artists  = [ a[tracks.c.artist]  for a in all_tracks ]
artists += [ a[tracks.c.remixer] for a in all_tracks ]

artists = [ split_regex.split(a) for a in artists ]
artists = list(itertools.chain(*artists))

# Sort case insensitive
artists = sorted(set(artists), key=lambda s: s.lower())
artists = []

for _, group in itertools.groupby(artists, lambda a: a.lower()):
  items = list(group)

  if len(items) == 1: continue

  print(items)

  good_index = int(input('Preference?: '))
  good_item  = items[good_index]

  del items[good_index]

  # These columns have artist names in them
  cols = [
    tracks.c.artist,
    tracks.c.remixer,
    tracks.c.title,
  ]

  col_names = [ c.name for c in cols ]

  filters = [ or_(*[c.like('%{}%'.format(a)) for c in cols]) for a in items ]

  for t in tracks.select().where(or_(*filters)).execute():
    media_file = mediafile.MediaFile(t[tracks.c.file_path])

    for c in col_names:
      val = getattr(media_file, c)

      if not val: continue

      for bad_item in items:
        replaced = val.replace(bad_item, good_item)
        if replaced == val: continue

        confirm = input('{} -> {} ?'.format(val, replaced))
        if confirm != 'y': continue

        setattr(media_file, c, replaced)
        media_file.save()

  print('')

#  for t in tracks.select().where(filters).execute():
#    print(t[])




#counted_artists = collections.Counter(artists)
#
#counted_artists_lower = collections.Counter([ a.lower() for a in artists])
#
#for artist, count in counted_artists.most_common():
#  if counted_artists_lower[artist.lower()] == count:
#    continue
#
#  suggestions = difflib.get_close_matches(artist, list(counted_artists))

#  print('{}: {}'.format(artist, suggestions))


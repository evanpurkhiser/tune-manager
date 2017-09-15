import bs4
import urllib.request
from urllib.parse import urljoin

import mediafile


# Beatports Genre mappings are pretty poor. For now, since I purchase *mostly
# hardcore* remap a few genres automatically.
genre_remapping = {
    'Hard Dance':             'Hardcore',
    'Hardcore / Hard Techno': 'Hardcore',
}


def has_metadata(media):
    """
    Determine if the provided mediafile contains beatport metadat.
    """
    webpage = media.mg_file.tags.get('WOAF')

    return webpage is not None and 'beatport.com' in webpage.url


def process(media):
    """
    Process the provided media file by querying beatport for additional details
    that beatport does *not* include in the ID3 tags. Returns a dict containing
    the pre-serialized track values which were modified.

    This *modifies* the media file passed in.
    """
    # Beatport seems to prefix the field with this control character
    track_url = media.mg_file.tags.get('WOAF').url.strip('\x03')

    with urllib.request.urlopen(track_url) as response:
        track = bs4.BeautifulSoup(response, 'html.parser')
        release_link = track.select('a.interior-track-release-artwork-link')[0]
        release_url = urljoin('http://www.beatport.com', release_link['href'])

    with urllib.request.urlopen(release_url) as response:
        release = bs4.BeautifulSoup(response, 'html.parser')

    # Get the list of tracks
    tracks = release.select('div.bucket.tracks ul.bucket-items li')

    # Get a mapping of track details (under the artwork)
    details = release.select('ul.interior-release-chart-content-list')[0]
    details = details.select('li')

    details = [i.find_all('span') for i in details]
    details = {s[0].text.lower(): s[1].text.strip() for s in details}

    # Update the track, reporting only modified fields.
    orig = mediafile.serialize(media)

    media.release = details['catalog']

    # Track is a single
    if len(tracks) == 1:
        media.disc  = ''
        media.track = ''
        media.album = ''

    # Track is part of an album (multiple tracks)
    else:
        media.track.total = len(tracks)
        media.disc = '1/1'

    if media.genre in genre_remapping:
        media.genre = genre_remapping[media.genre]

    updated = mediafile.serialize(media)

    # Return only changed values
    return {k: v for k, v in updated.items() if updated[k] != orig[k]}

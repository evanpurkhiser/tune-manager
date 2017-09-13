import bs4
import urllib.request
import urllib.parse

# Note that the slug does not matter
TRACK_PATH = 'track/slug/{beatport_id}'


def beatport_url(path, **kargs):
    path = path.format(**kargs)
    return urllib.parse.urljoin('https://www.beatport.com', path)


def get_details(track_url=None, track_id=None):
    if not track_url and track_id:
        track_url = beatport_url(TRACK_PATH, beatport_id=track_id)
    elif not track_url:
        raise ValueError('A track_id or track URL must be specified')

    with urllib.request.urlopen(track_url) as response:
        track = bs4.BeautifulSoup(response, 'html.parser')
        release_link = track.select('a.interior-track-release-artwork-link')[0]
        release_url = beatport_url(release_link['href'])

    with urllib.request.urlopen(release_url) as response:
        release = bs4.BeautifulSoup(response, 'html.parser')

    # Get the list of tracks
    tracks = release.select('div.bucket.tracks ul.bucket-items li')

    # Get a mapping of track details (under the artwork)
    details = release.select('ul.interior-release-chart-content-list')[0]
    details = details.select('li')

    details = [i.find_all('span') for i in details]
    details = {s[0].text.lower(): s[1].text.strip() for s in details}

    # Get artwork image element
    artwork = release.select('img.interior-release-chart-artwork')[0]

    return {
        'total_tracks': len(tracks),
        'artwork_url':  artwork['src'],
        'release':      details['catalog'],
    }

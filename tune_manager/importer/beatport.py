import json
import bs4
import requests
from urllib.parse import urljoin

from tune_manager import mediafile


# Beatports Genre mappings are pretty poor. For now, since I purchase *mostly
# hardcore* remap a few genres automatically.
genre_remapping = {
    "Hard Dance": "Hardcore",
    "Hardcore / Hard Techno": "Hardcore",
    "Trance (Main Floor)": "Trance",
}

user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"


def has_metadata(media):
    """
    Determine if the provided mediafile contains beatport metadat.
    """
    webpage = media.mg_file.tags.get("WOAF")

    return webpage is not None and "beatport.com" in webpage.url


def process(media):
    """
    Process the provided media file by querying beatport for additional details
    that beatport does *not* include in the ID3 tags. Returns a dict containing
    the pre-serialized track values which were modified.

    This *modifies* the media file passed in.
    """
    # Beatport seems to prefix the field with this control character
    track_url = media.mg_file.tags.get("WOAF").url.strip("\x03")

    # Track details
    response = requests.get(track_url, headers={"user-agent": user_agent})

    track = bs4.BeautifulSoup(response.content, "html.parser")
    track_data = track.select("script#__NEXT_DATA__")[0]
    track_data = json.loads(track_data.contents[0])

    release_id = track_data["props"]["pageProps"]["track"]["release"]["id"]
    release_url = urljoin("https://www.beatport.com/release/-/", str(release_id))

    # Release details
    response = requests.get(release_url, headers={"user-agent": user_agent})

    release = bs4.BeautifulSoup(response.content, "html.parser")
    release_data = release.select("script#__NEXT_DATA__")[0]
    release_data = json.loads(release_data.contents[0])

    catalog_id = release_data["props"]["pageProps"]["release"]["catalog_number"]
    tracks = release_data["props"]["pageProps"]["release"]["tracks"]

    # Update the track, reporting only modified fields.
    orig = mediafile.serialize(media)

    media.release = catalog_id

    # Track is a single
    if len(tracks) == 1:
        media.disc = ""
        media.track = ""
        media.album = ""

    # Track is part of an album (multiple tracks)
    else:
        media.track.total = len(tracks)
        media.disc = "1/1"

    if media.genre in genre_remapping:
        media.genre = genre_remapping[media.genre]

    updated = mediafile.serialize(media)

    # Return only changed values
    return {k: v for k, v in updated.items() if updated[k] != orig[k]}

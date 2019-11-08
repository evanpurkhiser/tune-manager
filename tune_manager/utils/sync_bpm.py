import sys
import os.path
import urllib

import mutagen
import mutagen.id3 as ID3
import xml.etree.ElementTree as ElementTree


def sync_bpm(rekordbox_xml, collection_root, prefix):
    tree = ElementTree.parse(os.path.realpath(rekordbox_xml))
    root = tree.getroot()

    tracks = root.findall("./COLLECTION/TRACK")

    for track in tracks:
        path = track.attrib["Location"].encode("utf8")
        path = urllib.unquote(path)

        path = path.replace(f"file://localhost{prefix}", collectionRoot)
        mutagen_file = mutagen.File(path)

        bpm = "{0:.2f}".format(round(float(track.attrib["AverageBpm"]) * 4) / 4)

        if "TBPM" not in mutagen_file.tags:
            mutagen_file.tags[ID3.TBPM.__name__] = ID3.TBPM(text=bpm, encoding=3)
            mutagen_file.tags.save()

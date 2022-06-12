import os.path
import hashlib

import mutagen
import mutagen.id3 as ID3
from collections import namedtuple


class TextField(object):
    """
    A plain-text field stored in the mutagen tags
    """

    def __init__(self, frame_type):
        self.frame_type = frame_type
        self.frame_name = frame_type.__name__

    def __get__(self, media_file, owner=None):
        """Get the field from the mutagen file"""
        if media_file.mg_file.tags is None:
            return None

        frames = media_file.mg_file.tags.getall(self.frame_name)

        # Always use the first frame in the list, ignoring others.
        # This could change, but we probably don't need this ID3 feature
        return frames[0].text[0] if frames else None

    def __set__(self, media_file, value):
        """Set the field in the mutagen file"""
        frame = self.frame_type(encoding=3, text=value)
        media_file.mg_file[self.frame_name] = frame

    def __delete__(self, media_file):
        """Remove the field from the mutagen file"""
        del media_file.mg_file[self.frame_name]


class SizeField(TextField):
    """
    A size field stored in the mutagen tags

    A size field consists of a 'number' and 'total'. These properties are
    unpacked from the raw plain-text field delimited by a slash. When this
    field is accessed a Size object will be returned with `number` and `total`
    properites. These properties may be modified and field will be re-packed
    appropriately.
    """

    class Size(object):
        @classmethod
        def unpack(cls, value, **kwargs):
            """
            Construct a Size object by unpacking the values from a string
            """
            if not value:
                return cls(value, **kwargs)

            # Ensure a list of exactly two integers
            try:
                values = list(map(int, value.split("/")[:2]))
                values += [0] * (2 - len(values))
            except ValueError:
                values = []

            return cls(value, *values, **kwargs)

        def __init__(self, raw, number=0, total=0, writeback=None):
            self.__dict__["writeback"] = writeback
            self.__dict__["packed"] = raw
            self.__dict__["number"] = number
            self.__dict__["total"] = total

        def __setattr__(self, name, value):
            self.__dict__[name] = value
            self.__dict__["packed"] = self.pack()
            self.sync()

        def pack(self):
            if self.number == 0 and self.total == 0:
                return ""

            return "{number:0{width}}/{total}".format(
                number=self.number, total=self.total, width=len(str(self.total))
            )

        __repr__ = pack
        __str__ = pack

        def sync(self):
            """Update the mutagen tag with the formatted size"""
            if self.writeback:
                self.writeback(self.pack())

    def __get__(self, media_file, owner=None):
        """
        Unpack the field into a Size object
        """
        value = super(SizeField, self).__get__(media_file, owner)

        # Setup the writeback function to update the field on change
        def writeback(value):
            self.__set__(media_file, value)

        return self.Size.unpack(value, writeback=writeback)


Artwork = namedtuple("Artwork", ["key", "mime", "data", "type"])


class ArtworkField(object):
    """
    A artwork list field
    """

    class ArtworkList(list):
        pass

    def make_artwork(self, apic):
        key = hashlib.md5(apic.data).hexdigest()
        return Artwork(key, apic.mime, apic.data, apic.type)

    def __get__(self, media_file, owner=None):
        """Get a list of all artworks in the mediafile"""
        if media_file.mg_file.tags is None:
            return []

        artworks = media_file.mg_file.tags.getall("APIC")

        return self.ArtworkList(self.make_artwork(a) for a in artworks)

    def __set__(self, media_file, artwork):
        apic = ID3.APIC(data=artwork.data, mime=artwork.mime)
        media_file.mg_file["APIC"] = apic


class MediaFile(object):
    """
    Representation of a media file with it's assorted meta data
    """

    artist = TextField(ID3.TPE1)
    title = TextField(ID3.TIT2)
    album = TextField(ID3.TALB)
    remixer = TextField(ID3.TPE4)
    publisher = TextField(ID3.TPUB)
    release = TextField(ID3.COMM)
    bpm = TextField(ID3.TBPM)
    key = TextField(ID3.TKEY)
    year = TextField(ID3.TDRC)
    genre = TextField(ID3.TCON)
    track = SizeField(ID3.TRCK)
    disc = SizeField(ID3.TPOS)
    artwork = ArtworkField()

    def __init__(self, filename):
        self.file_path = os.path.realpath(filename)
        self.reload()

        if not hasattr(self.mg_file, "tags"):
            raise ValueError("Loaded file does not have ID3 tags")

    def __dir__(self):
        return [
            "file_path",
            "artwork",
            "artist",
            "title",
            "album",
            "remixer",
            "publisher",
            "release",
            "key",
            "bpm",
            "year",
            "genre",
            "track",
            "disc",
        ]

    def reload(self):
        """
        Load the mutagen file from the media files path
        """
        self.mg_file = mutagen.File(self.file_path)

    def clear(self):
        """
        Remove all tags from the mediafile
        """
        self.mg_file.delete()

    def save(self):
        """
        Save the metadata of the file
        """
        self.mg_file.tags.save(self.file_path)


def serialize(media, trim_path=None):
    vals = {k: getattr(media, k) for k in dir(media)}

    for key, val in vals.items():
        if isinstance(val, SizeField.Size):
            vals[key] = val.pack()

        if isinstance(val, ID3.ID3TimeStamp):
            vals[key] = str(val)

        if isinstance(val, ArtworkField.ArtworkList):
            vals[key] = [a.key for a in val]

    if trim_path and vals["file_path"].startswith(trim_path):
        path = os.path.normpath(trim_path) + "/"
        vals["file_path"] = vals["file_path"][len(path) :]

    # The selected artwork will always be the 'Front Cover'
    artTypes = [a.type for a in media.artwork]

    try:
        vals["artwork_selected"] = artTypes.index(ID3.PictureType.COVER_FRONT)
    except ValueError:
        vals["artwork_selected"] = 0 if len(media.artwork) > 0 else None

    return vals

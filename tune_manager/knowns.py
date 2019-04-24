import itertools
import re

import db

# regex for splitting apart individual artist names
individual_artists = re.compile("(?:,| vs| &| Ft\.) ")


class KnownValues(object):
    """
    An instance of KnownValues provides means to lookup a list of all unique
    known values for specific fields in the database.

    >>> values = KnownValues(session)

    >>> values.individual_artists
    [ 'Gammer', 'Dougal', ... ]

    >>> values.genre
    [ 'Hardcore', 'Trance', ... ]
    """

    def __init__(self, session):
        self.session = session
        self.cache = {}

    def __getattr__(self, field):
        """
        Lookup a list of unique values for a field
        """
        if field in self.cache:
            return self.cache[field]

        tracks = self.session.query(db.Track).group_by(getattr(db.Track, field)).all()

        self.cache[field] = [getattr(t, field) for t in tracks]

        return self.cache[field]

    @property
    def individual_artists(self):
        """
        Get a list of all artists split on the individual_artists regex
        separator. 'Dougal & Gammer' would become ['Dougal', 'Gammer'].
        """
        if "individual_artists" in self.cache:
            return self.cache["individual_artists"]

        tracks = self.session.query(db.Track).all()

        artists = [t.artist for t in tracks]
        artists += [t.remixer for t in tracks]

        artists = [individual_artists.split(a) for a in artists]
        artists = list(itertools.chain(*artists))
        artists = [a.strip() for a in artists]

        self.cache["individual_artists"] = list(set(artists))

        return self.cache["individual_artists"]

    def clear_cache(self):
        """
        Wipe the cached know values to be repopulated upon next lookup.
        """
        self.cache = {}

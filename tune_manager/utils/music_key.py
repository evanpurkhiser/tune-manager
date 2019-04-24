"""Utilities for dealing with musical keys of tracks"""

# Maps camelot key codes to 256 terminal colors
KEY_COLORS = {

    '1B':  122,  '4B':  179,  '7B':  211,  '10B': 147,
    '2B':  157,  '5B':  216,  '8B':  176,  '11B': 117,
    '3B':  155,  '6B':  210,  '9B':  141,  '12B': 123,

    '1A':  158,  '4A':  228,  '7A':  218,  '10A': 152,
    '2A':  156,  '5A':  223,  '8A':  182,  '11A': 153,
    '3A':  193,  '6A':  217,  '9A':  183,  '12A': 159,
}

# Maps standard musical key notation into camelot style keys
CAMELOT_MAP = {

    'B':   '01B', 'Ab': '04B', 'F':  '07B', 'D':   '10B',
    'F#':  '02B', 'Eb': '05B', 'C':  '08B', 'A':   '11B',
    'Db':  '03B', 'Bb': '06B', 'G':  '09B', 'E':   '12B',

    'Abm': '01A', 'Fm': '04A', 'Dm': '07A', 'Bm':  '10A',
    'Ebm': '02A', 'Cm': '05A', 'Am': '08A', 'F#m': '11A',
    'Bbm': '03A', 'Gm': '06A', 'Em': '09A', 'Dbm': '12A',
}

# Maps camelot keys to standard musical notation keys
KEY_MAP = {v:k for k, v in CAMELOT_MAP.items()}

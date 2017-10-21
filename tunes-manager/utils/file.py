"""Module with utility functions to deal with music files"""

import re
import os
import itertools

FILE_TYPES = ('aif', 'mp3')

PATH_REPLACMENTS = {
    '[\*\?\|:"<>]': '',
    '[\x00-\x1f]':  '_',
    '[\\\\/]':      '-',
    '\.$':          '',
    '^\.':          '',
    '\s+$':         '',
    '^\s+':         '',
}


def determine_path(media):
    """Determine the filename and path of a track based on it's tags
    """
    path_parts = []
    name_parts = []

    # Construct track directory names
    #
    # {publisher}/[{catalog_number}] {album}/Disc {disc}/
    #
    #  - If publisher is None: '[+no-label]'
    #  - If album and catalog_number is None: '[+singles]'
    #  - Disc part not required if there is only 1 disc
    #

    # First directory is the publisher
    path_parts.append(media.publisher or '[+no-label]')

    # Second directory is the album name and catalog number
    if media.album and media.release:
        path_parts.append('[{}] {}'.format(media.release, media.album))
    elif media.album and not media.release:
        path_parts.append('[--] {}'.format(media.album))
    else:
        path_parts.append(media.album or '[+singles]')

    # If the album has multiple discs include them as a directory
    if media.disc.total > 1:
        path_parts.append('Disc {}'.format(media.disc.number))

    # Construct track filename
    #
    # {track.number}. [{release}] [{key}] {artist} - {title}
    #
    #  - Exclude track number (and trailing dot) if track is a single
    #  - Exclude key (with enclosing brackets) unless available
    #  - Exclude catalog number (with enclosing brackets) if track is a single
    #

    # If part of an album or EP include the track number
    if media.album and media.track.number:
        name_parts.append('{0:02}.'.format(media.track.number))

    # If this track is a single and has a catalog number include it
    if not media.album and media.release:
        name_parts.append('[{}]'.format(media.release))

    # Include key of the track if available
    name_parts.append('[{}]'.format(media.key or '--'))

    # Finally artist and title of the track
    name_parts.append('{} - {}'.format(media.artist, media.title))

    # Construct the logical path
    path_parts.append(' '.join(name_parts))

    # Remove special characters from parts
    for p, r in PATH_REPLACMENTS.items():
        path_parts = [re.sub(p, r, c) for c in path_parts]

    # Convert to full path
    return os.path.join(*path_parts) + os.path.splitext(media.file_path)[1]


def track_path(path, library_path):
    """Normalize track path by removing the library path
    """
    if not path.startswith(library_path):
        raise RuntimeError('Track path is not within the library')

    library_path = os.path.normpath(library_path)

    # Account for the leading slash
    return path[len(library_path) + 1:]


def collect_files(paths, recursive=False, types=FILE_TYPES):
    """Collect paths to all supported media files given a list of directories
    """
    files = set()

    assert isinstance(paths, list)

    # Add files given as paths directly to the fileset
    files.update([os.path.realpath(f) for f in paths
        if os.path.isfile(f) and f.endswith(types)])

    # Setup directory walk generators for each path
    walkers = [os.walk(d) for d in paths if os.path.isdir(d)]

    # Combine all generators into one when we want to recursively walk,
    # otherwise just take the first directory for each generator
    if recursive:
        walkers = itertools.chain(*walkers)
    else:
        walkers = map(next, walkers)

    # Add all files into a list
    for root, dirnames, filenames in walkers:
        files.update([os.path.join(root, f) for f in filenames if f.endswith(types)])

    return list(sorted(files))

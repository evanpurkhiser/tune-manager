import mutagen
import mutagen.id3 as ID3
import os
import subprocess
import tempfile

remap = {
    'TXXX:ARRANGER':     ID3.TPE4,
    'TXXX:ORGANIZATION': ID3.TPUB,
    'TXXX:COMMENT':      ID3.COMM,
}


def remap_id3tags(path):
    """
    When transforming a file from FLAC to AIFF using ffmpeg with the
    -write_id3v2 flag, some tags are not written into their associated ID3 tag.
    This transforms those tags to be correct.
    """
    track = mutagen.File(path)

    for tag_name, mapped_tag in remap.items():
        if tag_name not in track:
            continue

        new_tag = mapped_tag(encoding=3, desc='', text=track[tag_name].text[0])
        track[new_tag.FrameID] = new_tag
        del track[tag_name]

    track.save()


def convert_track(path):
    """
    Execute an ffmpeg dance to convert the provided file from a convertable
    format into a AIFF file.
    """
    new_path = os.path.splitext(path)[0] + '.aif'

    # We create a temporary file to write the converted file into so that the
    # ImporterWatcher doesn't pickup on the new file until *after* we have
    # fully transformed it.
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_file.close()

    # ffmpeg incantation for transforming the file to a AIFF file *while
    # preserving* the ID3 tags. Some transformations to these may need to be
    # done later.
    options = '-y -f aiff -write_id3v2 1'.split(' ')
    command = ['ffmpeg', '-i', path] + options + ['--', temp_file.name]

    process = subprocess.Popen(command, stderr=subprocess.PIPE)

    if process.wait() > 0:
        raise Exception('Failed to convert file: {}'.format(path))

    remap_id3tags(temp_file.name)

    os.rename(temp_file.name, new_path)
    os.remove(path)

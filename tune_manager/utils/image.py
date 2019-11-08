import io
from PIL import Image

from tune_manager.mediafile import Artwork

NORMAL_SIZE = 500


def normalize_artwork(art, size=NORMAL_SIZE):
    image = Image.open(io.BytesIO(art.data))
    h, w = image.size

    if h < size or w < size:
        return art

    image.thumbnail((size, size), resample=Image.BICUBIC)

    data = io.BytesIO()
    image.save(data, image.format, quality=90)

    return Artwork(art.key, art.mime, data.getvalue(), None)

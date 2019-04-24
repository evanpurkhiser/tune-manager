import os.path
import asyncio

from sanic import Sanic, response
from sanic_cors import CORS
import sqlalchemy
import requests
import json

from mediafile import Artwork
import catalog
import db
import importer.filesystem
import knowns

LIBRARY = "/Users/evan/Music/Tracks"
IMPORT_PATH = os.path.expanduser("~/music-to-import")

DISCOGS_TOKEN = "ZTMTrzXddIDNOTLCTKEpQmFsjGyGNHlIeXpgzRNL"
DISCOGS_AUTH = f"Discogs token={DISCOGS_TOKEN}"

db.init(sqlalchemy.create_engine("sqlite:///database.db"))
session = db.Session()

app = Sanic(__name__)
CORS(app)

# Disable keepalive to stop timeouts
app.config.KEEP_ALIVE = False

# Hide sanic logo, it just takes too much console!
app.config.LOGO = None

app.known_values = knowns.KnownValues(session)

# Begin processing track file events
@app.listener("before_server_start")
def start_processor(app, loop):
    processor = importer.filesystem.TrackProcessor(IMPORT_PATH, loop=loop)
    processor.add_all()
    app.processor = processor


# Begin indexing the collection
# TODO: Maybe this will go away soon or move somewhere else as this application
#       expands into a general music server.
@app.listener("before_server_start")
def index_collection(app, loop):
    indexer = catalog.MetadataIndexer(LIBRARY, session, loop)


#    indexer.watch_collection()
#    indexer.reindex()


# Application handlers
@app.websocket("/events")
async def events(request, ws):
    await app.processor.open_connection(ws)


@app.websocket("/static")
async def statics(request):

    await app.processor.open_connection(ws)


@app.route("/known-values")
async def known_values(request):
    return response.json(
        {
            "artists": app.known_values.individual_artists,
            "publishers": app.known_values.publisher,
            "genres": app.known_values.genre,
        }
    )


@app.route("/save", methods=["POST"])
async def save(request):
    artwork = request.files.getlist("artwork", [])
    artwork = [Artwork(f.name, f.type, f.body, None) for f in artwork]
    app.processor.cache_art(artwork)

    data = json.loads(request.form.get("data"))
    app.processor.save_all(data["tracks"], data["options"])

    return response.text("")


@app.route("/artwork/<key>")
async def artwork(request, key):
    if key not in app.processor.artwork:
        return response.json({"message": "invalid artwork ID"}, status=404)

    print("getting artwork")

    art = app.processor.artwork[key]

    return response.raw(art.data, content_type=art.mime)


@app.route("/discogs-proxy", strict_slashes=False)
async def discogs_proxy(request):
    url = request.args["url"][0]
    headers = {"Authorization": DISCOGS_AUTH}

    res = requests.get(url, headers=headers)
    return response.raw(res.content, content_type=res.headers["content-type"])


# Gotta go fast!
app.run(host="0.0.0.0", port=8000, debug=True)

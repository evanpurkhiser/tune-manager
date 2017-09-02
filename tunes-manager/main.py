import os.path

import sqlalchemy
from sanic import Sanic, response
from sanic_cors import CORS

import catalog
import importer.filesystem
import knowns
import db

LIBRARY = '/Users/evan/Music/TracksLocal'
IMPORT_PATH = os.path.expanduser('~/music-to-import')

db.init(sqlalchemy.create_engine('sqlite:///database.db'))
session = db.Session()

app = Sanic(__name__)
CORS(app)

app.known_values = knowns.KnownValues(session)

# Begin processing track file events
@app.listener('before_server_start')
def start_processor(app, loop):
    processor = importer.filesystem.TrackProcessor(IMPORT_PATH, loop=loop)
    processor.add_all()
    app.processor = processor

# Begin indexing the collection
# TODO: Maybe this will go away soon or move somewhere else as this application
#       expands into a general music server.
@app.listener('before_server_start')
def index_collection(app, loop):
    indexer = catalog.MetadataIndexer(LIBRARY, session)
    indexer.reindex()
    indexer.watch_collection()

# Application handlers
@app.websocket('/events')
async def events(request, ws):
    await app.processor.open_connection(ws)

@app.route('/known-values')
async def known_values(request):
    return response.json({
        'artists':    app.known_values.individual_artists,
        'publishers': app.known_values.publisher,
        'genres':     app.known_values.genre,
    })

@app.route('/artwork/<index>@<track_id>')
async def artwork(request, index, track_id):
    if track_id not in app.processor.mediafiles:
        return response.json({ 'message': 'invalid track ID'}, status=404)

    art = app.processor.mediafiles[track_id].artwork[int(index)]

    return response.raw(art.data, content_type=art.mime)


# Gotta go fast!
app.run(host="0.0.0.0", port=8000)


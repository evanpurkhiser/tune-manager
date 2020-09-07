from sanic import Blueprint, response
import requests
import json

from tune_manager import knowns
from tune_manager.mediafile import Artwork
from tune_manager.importer import filesystem

blueprint = Blueprint("importer")

# Begin processing track file events
@blueprint.listener("before_server_start")
def start_processor(app, loop):
    processor = filesystem.TrackProcessor(app.config.STAGING_PATH, loop=loop)
    processor.add_all()
    app.processor = processor
    app.known_values = knowns.KnownValues(app.db_session)


# Application handlers
@blueprint.websocket("/events")
async def events(request, ws):
    await request.app.processor.open_connection(ws)


@blueprint.websocket("/static")
async def statics(request):
    await request.app.processor.open_connection(ws)


@blueprint.route("/known-values")
async def known_values(request):
    app = request.app
    return response.json(
        {
            "artists": app.known_values.individual_artists,
            "publishers": app.known_values.publisher,
            "genres": app.known_values.genre,
        }
    )


@blueprint.route("/save", methods=["POST"])
async def save(request):
    app = request.app
    artwork = request.files.getlist("artwork", [])
    artwork = [Artwork(f.name, f.type, f.body, None) for f in artwork]
    app.processor.cache_art(artwork)

    data = json.loads(request.form.get("data"))
    app.processor.save_all(data["tracks"], data["options"])

    return response.text("")


@blueprint.route("/artwork/<key>")
async def artwork(request, key):
    app = request.app
    if key not in app.processor.artwork:
        return response.json({"message": "invalid artwork ID"}, status=404)

    art = app.processor.artwork[key]

    return response.raw(art.data, content_type=art.mime)


@blueprint.route("/discogs-proxy", strict_slashes=False)
async def discogs_proxy(request):
    url = request.args["url"][0]
    headers = {"Authorization": request.app.config.DISCOGS_AUTH}

    res = requests.get(url, headers=headers)
    return response.raw(res.content, content_type=res.headers["content-type"])

import os

from sanic import Blueprint, response

import catalog
import db

blueprint = Blueprint("catalog")


@blueprint.listener("after_server_start")
def index_collection(app, loop):
    app.indexer = catalog.MetadataIndexer(
        app.config.LIBRARY, app.config.ARTWORK_PATH, app.db_session, loop
    )
    loop.create_task(app.indexer.watch_collection())
    loop.create_task(app.indexer.reindex())


@blueprint.route("/artwork/<key>")
async def statics(request, key):
    return await response.file(
        os.path.join(request.app.config.ARTWORK_PATH, key[0:2], key)
    )


@blueprint.route("/query")
async def query(request):
    pass

import os

from sqlalchemy import inspect

from sanic import Blueprint, response

import catalog
import db

blueprint = Blueprint("catalog")


@blueprint.listener("after_server_start")
def index_collection(app, loop):
    app.indexer = catalog.MetadataIndexer(
        app.config.LIBRARY_PATH, app.config.ARTWORK_PATH, app.db_session, loop
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
    data = request.app.db_session.query(db.Track).limit(50).all()

    return response.json(
        [
            {c.key: getattr(obj, c.key) for c in inspect(obj).mapper.column_attrs}
            for obj in data
        ]
    )

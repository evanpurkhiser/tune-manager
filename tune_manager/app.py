import argparse
import asyncio
import os
import os.path
import logging

from sanic import Sanic, response
from sanic_cors import CORS
from sqlalchemy import create_engine

from tune_manager import settings, db
from tune_manager.api import importer, catalog

parser = argparse.ArgumentParser()
parser.add_argument("--host", default="0.0.0.0")
parser.add_argument("--port", default="8080")
parser.add_argument("--workers", type=int, default=1)
parser.add_argument("--reload", action="store_true")
parser.add_argument("--statics", default="dist/")
parser.add_argument("--storage-path", default="db/")
parser.add_argument("--library-path", required=True)
parser.add_argument("--staging-path", required=True)

args = parser.parse_args()

app = Sanic(__name__)
CORS(app)


# Configuration
storage_path = os.path.abspath(args.storage_path)
db_path = os.path.join(storage_path, "database.db")

if not os.path.exists(storage_path):
    os.makedirs(storage_path)

args_config = {
    "LIBRARY_PATH": args.library_path,
    "STAGING_PATH": args.staging_path,
    "DATABASE_PATH": f"sqlite:///{db_path}",
    "ARTWORK_PATH": os.path.join(storage_path, "artwork"),
}

app.config.from_object(settings)
app.config.update(args_config)

# Setup the database and assign it on the app object
app.db_session = db.init(
    create_engine(app.config.DATABASE_PATH, connect_args={"check_same_thread": False})
)

app.blueprint(importer.blueprint, url_prefix="/api")
app.blueprint(catalog.blueprint, url_prefix="/api/catalog")

statics_path = os.path.join(os.getcwd(), args.statics)

# Static file serving
@app.route("/")
@app.route("/<path:path>")
async def serve_statics(request, path=""):
    file_path = os.path.join(statics_path, path)
    return await (
        response.file(file_path)
        if os.path.isfile(file_path)
        else response.file(os.path.join(statics_path, "index.html"))
    )


@app.listener("after_server_stop")
async def shutdown_tasks(app, loop):
    this_task = asyncio.current_task()
    tasks = [t for t in asyncio.all_tasks() if t is not this_task]

    for task in tasks:
        task.cancel()

    await asyncio.gather(*tasks)


def main():
    app.run(
        host=args.host, port=args.port, workers=args.workers, auto_reload=args.reload
    )

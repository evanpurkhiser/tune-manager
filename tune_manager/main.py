import argparse
import os.path
import sys

from sanic import Sanic
from sanic_cors import CORS
from sqlalchemy import create_engine

sys.path.insert(0, os.path.join(os.path.dirname(__file__), os.pardir))

from tune_manager.api import importer, catalog
from tune_manager import settings
from tune_manager import db

parser = argparse.ArgumentParser()
parser.add_argument("--host", default="0.0.0.0")
parser.add_argument("--port", default="8080")
parser.add_argument("--workers", type=int, default=1)
parser.add_argument("--debug", action="store_true")
args = parser.parse_args()

app = Sanic(__name__)
app.config.from_object(settings)
CORS(app)

# Setup the database and assign it on the app object
db.init(create_engine(app.config.DATABASE_PATH))
app.db_session = db.Session()

app.blueprint(importer.blueprint, url_prefix="/api")
app.blueprint(catalog.blueprint, url_prefix="/api/catalog")

if __name__ == "__main__":
    app.run(host=args.host, port=args.port, workers=args.workers, debug=args.debug)

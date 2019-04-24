from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, String, Integer

Base = declarative_base()
Session = sessionmaker()


def init(engine):
    Session.configure(bind=engine)
    Base.metadata.create_all(engine)


class Track(Base):
    __tablename__ = "track"

    id = Column(Integer, primary_key=True)
    mtime = Column(Integer, index=True)
    file_path = Column(String(255), unique=True)
    file_hash = Column(String(32), unique=True)
    artwork_hash = Column(String(32), index=True)
    artist = Column(String(255))
    title = Column(String(255))
    remixer = Column(String(255))
    album = Column(String(255))
    release = Column(String(255))
    publisher = Column(String(255))
    disc = Column(String(7))
    track = Column(String(7))
    genre = Column(String(255))
    key = Column(String(3))
    bpm = Column(String(6))
    year = Column(String(6))

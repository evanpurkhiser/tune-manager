import asyncio
import concurrent.futures
import enum
import hashlib
import itertools
import json
import keyfinder
import multiprocessing
import os
import watchdog.observers

import importer.convert
import importer.beatport
import mediafile
import utils.file

# This list specifies file extensions that are directly supported for
# importing, without requiring any type of conversion.
VALID_FORMATS = ['.mp3', '.aif']


def future_raise(future):
    if future.exception(): raise future.exception()


def file_id(path):
    """
    Compute the identifier of a file given it's path. This is simply the md5
    sum of the file path without the file extension.
    """
    return hashlib.md5(os.path.splitext(path)[0].encode('utf-8')).hexdigest()


class EventType(enum.Enum):
    TRACK_DETAILS    = enum.auto()
    TRACK_REMOVED    = enum.auto()
    TRACK_PROCESSING = enum.auto()
    TRACK_UPDATE     = enum.auto()


class TrackProcesses(enum.Enum):
    CONVERTING      = enum.auto()
    KEY_COMPUTING   = enum.auto()
    BEATPORT_IMPORT = enum.auto()


class ImportWatcher(object):
    """
    A watchdog event handler which asynchronously dispatches events.
    """
    def __init__(self, loop, importer_api):
        self.loop = loop
        self.importer_api = importer_api

    def dispatch(self, event):
        event = self.importer_api.file_event(event)
        self.loop.call_soon_threadsafe(asyncio.ensure_future, event)


class TrackProcessor(object):
    """
    TrackProcessor provides a service for managing and processing the tracks
    currently in the importing collection.

    This service is resposible for:

    * Watching the filesystem for tracks to be removed, reporting track
      details, and triggering track processing upon these events.

    * Queueing tracks to be converted if they are not a valid format.

    * Queueing key detection for new tracks.

    The following message types will be sent:

    - TRACK_DETAILS

      When the client first connects to the endpoint all tracks that are
      currently being tracked in the new tracks directory will be reported as
      added. This directory will also be watched which will send new track
      details.

    - TRACK_REMOVED

      If a file is removed from the directory

    - TRACK_PROCESSING

      This event is triggered when the track is undergoing a processing event
      that may take enough time that it warrents representation in the UI.

      The following processing events are possible:

      * CONVERTING

        The track was found, but is not in a valid format and must first be
        converted.

      * KEY_COMPUTING

        Computation of musical key takes some time, this message will be
        reported to the client when a key for a track is beginning to be
        computed. When the client first connects.

      * BEATPORT_IMPORT

        Tracks purchased from beatport have identifying information which can
        be used to retrieve more information about the track.

    - TRACK_UPDATE

      Reported when partial information becomes available for a track. The
      event will report what processing event was fulfilled by this partial
      information with the 'completed_process' item key.

    The websocket connection is available at ws://localhost:9000.
    """
    def __init__(self, import_path, batch_period=300, loop=None):
        self.import_path = import_path
        self.batch_period = batch_period

        self.loop = loop or asyncio.get_event_loop()
        self.events = asyncio.Queue()
        self.connections = set()

        # Tracked mediafiles will be stored as a dict of their ID mapped to the
        # media file object representing them.
        self.mediafiles = {}

        # Current processing tracks
        self.processing = []

        # The process executor will be used to parallelize key detection
        # Limit threads to the number of cores we have, key detection becomes a
        # pretty expensive computation.
        cores = multiprocessing.cpu_count()
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=cores)

        # Setup filesystem watchdog
        watcher = ImportWatcher(self.loop, self)

        observer = watchdog.observers.Observer()
        observer.schedule(watcher, import_path, recursive=True)

        async def file_dispatcher():
            observer.start()
            while True: await asyncio.sleep(1)

        # kickoff coroutines
        asyncio.ensure_future(file_dispatcher(), loop=self.loop)
        asyncio.ensure_future(self.dispatcher(), loop=self.loop)

    async def open_connection(self, ws):
        self.connections.add(ws)
        self.report_state(ws)

        try:
            while True: await ws.recv()
        except Exception:
            self.connections.remove(ws)

    async def dispatcher(self):
        while True:
            # Batch messages together over this period of time
            await asyncio.sleep(self.batch_period / 1000)
            events = []

            if self.events.empty():
                continue

            while not self.events.empty():
                events.append(await self.events.get())

            # Nothing to dispatch without any connections
            if not self.connections:
                continue

            for event in self.group_events(events):
                data = json.dumps(event)
                futures = [ws.send(data) for ws in self.connections]
                asyncio.ensure_future(*futures)

    async def file_event(self, event):
        """
        When the filesystem observer sees a new file added or removed from the
        import collection this method will be called, triggering the
        appropriate action.
        """
        commands = {
            'created': self.add,
            'deleted': self.remove,
        }

        if event.is_directory or event.event_type not in commands:
            return

        commands[event.event_type](event.src_path)

    def group_events(self, events):
        key_on = lambda k: k['type']

        events.sort(key=key_on)

        for event_type, items in itertools.groupby(events, key=key_on):
            items = [e['item'] for e in items]
            yield { 'type': event_type, 'items': items }

    def send_event(self, event_type, identifier, **kwargs):
        item = { 'id': identifier }
        item.update(kwargs)

        self.events.put_nowait({ 'type': event_type.name, 'item': item })

    def send_details(self, identifier, track):
        self.send_event(EventType.TRACK_DETAILS, identifier, **track)

    def send_processing(self, identifier, process):
        self.processing.append((identifier, process))

        item = { 'process': process.name }
        self.send_event(EventType.TRACK_PROCESSING, identifier, **item)

    def send_update(self, identifier, completed_process, **kwargs):
        self.processing.remove((identifier, completed_process))

        item = { 'completed_process': completed_process.name }
        item.update(kwargs)

        self.send_event(EventType.TRACK_UPDATE, identifier, **item)

    def report_state(self, ws):
        # Report existing tracks and current processes. Events will be batched
        # together and dispatched.
        for identifier, media in self.mediafiles.items():
            track = mediafile.serialize(media, trim_path=self.import_path)
            self.send_details(identifier, track)

        for identifier, process in self.processing:
            self.send_processing(identifier, process)

    def execute_paralell(self, fn, *args):
        self.executor.submit(fn, *args).add_done_callback(future_raise)

    def convert_track(self, identifier, path):
        process = TrackProcesses.CONVERTING
        self.send_processing(identifier, process)

        importer.convert.convert_track(path)
        self.send_update(identifier, process)

    def compute_key(self, identifier, media):
        process = TrackProcesses.KEY_COMPUTING
        self.send_processing(identifier, process)

        # Prefix key with leading zeros
        media.key = keyfinder.key(media.file_path).camelot().zfill(3)
        self.send_update(identifier, process, key=media.key)

        #media.save()

    def beatport_update(self, identifier, media):
        process = TrackProcesses.BEATPORT_IMPORT
        self.send_processing(identifier, process)

        fields = importer.beatport.process(media);
        self.send_update(identifier, process, **fields)

        #media.save()

    def add_all(self):
        """
        Add all existing tracks in the import path
        """
        path  = self.import_path
        types = tuple(VALID_FORMATS + importer.convert.CONVERTABLE_FORMATS)

        for path in utils.file.collect_files([path], recursive=True, types=types):
            self.add(path)

    def add(self, path):
        """
        Add a track to the tracked import list.
        """
        identifier = file_id(path)
        ext = os.path.splitext(path)[1]

        # File may need to be transformed before it can be processed for
        # importing.
        if ext in importer.convert.CONVERTABLE_FORMATS:
            self.execute_paralell(self.convert_track, identifier, path)
            return

        if ext not in VALID_FORMATS:
            return

        # Track ready to be reported
        media = mediafile.MediaFile(path)

        # Recompute the key if it is missing or invalid
        valid_keys = keyfinder.notations.camelot.values()

        if not media.key or not media.key.strip('0') in valid_keys:
            media.key = ''
            self.execute_paralell(self.compute_key, identifier, media)

        # Request more details from beatport
        if importer.beatport.has_metadata(media):
            self.execute_paralell(self.beatport_update, identifier, media)

        # Report track details
        self.mediafiles[identifier] = media

        track = mediafile.serialize(media, trim_path=self.import_path)
        self.send_details(identifier, track)

    def remove(self, path):
        """
        Remove a track from the tracked import list.
        """
        identifier = file_id(path)

        if identifier not in self.mediafiles:
            return

        self.send_event(EventType.TRACK_REMOVED, identifier)
        del self.mediafiles[identifier]

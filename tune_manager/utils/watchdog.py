import asyncio


class AsyncHandler(object):
    """
    A watchdog event handler which asynchronously dispatches events.
    """
    def __init__(self, loop, handler):
        self.loop = loop
        self.handler = handler

    def dispatch(self, event):
        event = self.handler(event)
        self.loop.call_soon_threadsafe(asyncio.ensure_future, event)

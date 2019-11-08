import sentry_sdk

sentry_sdk.init("https://208c1692ec594314acbc4e63a3fd775e@sentry.io/1805605")

from .app import main  # NOQA

if __name__ == "__main__":
    main()

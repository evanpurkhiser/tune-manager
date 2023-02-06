#!/usr/bin/env sh

exec pdm run tunemanager \
	--port=80 \
	--library-path=/library \
	--staging-path=/staging \
	--storage-path=/storage

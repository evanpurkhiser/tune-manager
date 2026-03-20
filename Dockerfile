FROM node:16-alpine AS frontend-build

WORKDIR /app

RUN apk add --no-cache python3 make g++
ENV PYTHON=/usr/bin/python3

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock /app/
RUN yarn install --frozen-lockfile --production=true

COPY webpack.config.ts tsconfig.json /app/
COPY app /app/app/

RUN yarn build

FROM python:3.9-alpine3.12

RUN apk add --update \
      build-base \
      musl-dev \
      zlib-dev \
      jpeg-dev \
      openssl-dev \
      libffi-dev \
      ffmpeg \
      ffmpeg-dev \
      libkeyfinder-dev \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Setup PDM
ENV PIP_DISABLE_PIP_VERSION_CHECK=on
RUN pip install pdm
ENV PYTHONPATH=/usr/local/lib/python3.9/site-packages/pdm/pep582

# install python deps
COPY pdm.lock pyproject.toml /app/
RUN pdm install

# Setup volumes for database, 
VOLUME /library
VOLUME /staging
VOLUME /storage

# Add python source
COPY tune_manager /app/tune_manager/
RUN pdm install

# Add frontend build
COPY --from=frontend-build /app/dist /app/dist
COPY dockerStart.sh /app/

CMD ["./dockerStart.sh"]

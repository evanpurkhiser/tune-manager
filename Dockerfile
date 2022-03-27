FROM python:3.9-alpine3.12

RUN apk add --update \
      curl \
      build-base \
      musl-dev \
      zlib-dev \
      jpeg-dev \
      openssl-dev \
      libffi-dev \
      ffmpeg \
      ffmpeg-dev \
      yarn \
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

# Setup frontend dependencies
COPY package.json yarn.lock /app/
RUN yarn install

# Setup volumes for database, 
VOLUME /library
VOLUME /staging
VOLUME /storage

# Add python source
COPY tune_manager /app/tune_manager/
RUN pdm install

# Build javascript app
COPY webpack.config.ts tsconfig.json /app/
COPY app /app/app/
RUN yarn build

CMD ["pdm", "run", "tunemanager", \
     "--port=80", \
     "--library-path=/library", \
     "--staging-path=/staging", \
     "--storage-path=/storage"]

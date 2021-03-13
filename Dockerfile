FROM python:3.8-alpine3.12

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

# Setup poetry
ENV PIP_DISABLE_PIP_VERSION_CHECK=on \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_CREATE=0 \
    POETRY_NO_INTERACTION=1
ENV PATH="$POETRY_HOME/bin:$VENV_PATH/bin:$PATH"
RUN curl -sSL https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py | python

# install python deps
COPY poetry.lock pyproject.toml /app/
RUN poetry install

# Setup frontend dependencies
COPY package.json yarn.lock /app/
RUN yarn install

# Setup volumes for database, 
VOLUME /library
VOLUME /staging
VOLUME /storage

# Add python source
COPY tune_manager /app/tune_manager/
RUN poetry install

# Build javascript app
COPY webpack.config.js tsconfig.json /app/
COPY app /app/app/
RUN yarn build

CMD ["tunemanager", \
     "--port=80", \
     "--library-path=/library", \
     "--staging-path=/staging", \
     "--storage-path=/storage"]

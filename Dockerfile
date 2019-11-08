FROM python:3.7.4-alpine3.10

RUN apk add --update \
      build-base \
      musl-dev \
      zlib-dev \
      jpeg-dev \
      ffmpeg-dev \
      yarn \
      libkeyfinder-dev \
    && rm -rf /var/cache/apk/*

ENV PIP_DISABLE_PIP_VERSION_CHECK=on
WORKDIR /app

# Setup python dependencies
RUN pip3 install poetry
COPY poetry.lock pyproject.toml /app/
RUN poetry config settings.virtualenvs.create false
RUN poetry install --no-interaction

# Setup frontend dependencies
COPY package.json yarn.lock /app/
RUN yarn install

# Setup volumes for database, 
VOLUME /library
VOLUME /staging
VOLUME /storage

# Build javascript app
COPY app /app/app/
COPY webpack.config.js tsconfig.json /app/
RUN yarn build

# Copy application source
COPY . /app/

CMD ["python", "/app/tune_manager/main.py", \
     "--library-path=/library", \
     "--staging-path=/staging", \
     "--storage-path=/storage"]

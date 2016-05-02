# Copyright 2016, EMC, Inc.

FROM mhart/alpine-node:4

COPY . /RackHD/on-core/

RUN apk add --update git \
  && cd /RackHD/on-core \
  && npm install --ignore-scripts --production

VOLUME /opt/monorail

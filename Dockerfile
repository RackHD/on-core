# Copyright 2016, EMC, Inc.

FROM mhart/alpine-node:4

RUN apk add --update git

RUN mkdir -p /RackHD/on-core

COPY ./package.json /tmp/
RUN cd /tmp && npm install --ignore-scripts --production

COPY . /RackHD/on-core/
RUN cp -a -f /tmp/node_modules /RackHD/on-core/

ENV DEBIAN_FRONTEND noninteractive

VOLUME /opt/monorail

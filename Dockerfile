# Copyright 2016, EMC, Inc.
ARG repo=node
ARG tag=8.9.4

FROM ${repo}/wheezy:${tag}

COPY . /RackHD/on-core/

RUN cd /RackHD/on-core \
  && npm install \
  && npm prune --production \
  && npm install --production

VOLUME /opt/monorail

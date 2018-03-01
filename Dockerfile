# Copyright 2016-2018, Dell EMC, Inc.
ARG repo=node
ARG tag=4.8.7-wheezy

FROM ${repo}:${tag}

RUN npm install -g npm@5.7.1

COPY . /RackHD/on-core/

RUN cd /RackHD/on-core \
  && npm install \
  && npm prune --production

VOLUME /opt/monorail

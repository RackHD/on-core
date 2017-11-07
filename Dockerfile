# Copyright 2016, EMC, Inc. 
ARG repo=nodesource
ARG tag=4.4.6

FROM ${repo}/wheezy:${tag}

COPY . /RackHD/on-core/

RUN cd /RackHD/on-core \
  && npm install \
  && npm prune --production

VOLUME /opt/monorail

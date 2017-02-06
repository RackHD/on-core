# Copyright 2016, EMC, Inc.

FROM nodesource/wheezy:4.4.6

ADD https://raw.githubusercontent.com/RackHD/on-build-config/master/build-release-tools/docker_sources.list /etc/apt/sources.list
COPY . /RackHD/on-core/

RUN cd /RackHD/on-core \
  && npm install --ignore-scripts --production

VOLUME /opt/monorail

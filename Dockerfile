# Copyright 2016, EMC, Inc.

FROM nodesource/wheezy:4.4.6

COPY . /RackHD/on-core/

RUN cd /RackHD/on-core \
  && npm install --ignore-scripts --production

VOLUME /opt/monorail

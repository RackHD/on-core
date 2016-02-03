FROM node:argon

RUN mkdir -p /RackHD/on-core
WORKDIR /RackHD/on-core

COPY ./package.json /tmp/
RUN cd /tmp && npm install --ignore-scripts --production

COPY . /RackHD/on-core/
RUN cp -a /tmp/node_modules /RackHD/on-core/

ENV DEBIAN_FRONTEND noninteractive

ENV amqp $amqp
ENV mongo $mongo
ENV statsd $statsd

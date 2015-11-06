# on-core [![Build Status](http://travis-ci.org/RackHD/on-core.svg?branch=master)](https://travis-ci.org/RackHD/on-core) [![Code Climate](https://codeclimate.com/github/RackHD/on-core/badges/gpa.svg)](https://codeclimate.com/github/RackHD/on-core)

`on-core` provides common node.js libraries for applications in the RackHD project.

Copyright 2015, EMC, Inc.

## CI/testing

Prereqs:

The tests included with this project are a combination of strictly unit
and some functional tests, so to run to completion and correctly expect
some services to be available and running locally:

 - rabbitmq
 - mongodb

`./HWIMO-TEST` will run local tests, and was built for running on a jenkins build slave, and will run the tests, jshint, and code coverage all together.


# Configuration

The following configuration values can be overridden via the environment, command line, or via the global configuration file located at /opt/onrack/etc/monorail.json.

The global configuration file location can be overridden by setting a new configuration file value in the environment using the MONORAIL_CONFIG environment variable.

## amqp

Defaults to `amqp://localhost`.

## mongo

Defaults to `mongodb://localhost/pxe`.

## statsd

Defaults to `localhost:8125`.

## sharedKey

A 32 bit base 64 encoded string, defaults to `qxfO2D3tIJsZACu7UA6Fbw0avowo8r79ALzn+WeuC8M=`.

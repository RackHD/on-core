# on-core [![Build Status](http://travis-ci.org/RackHD/on-core.svg?branch=master)](https://travis-ci.org/RackHD/on-core) [![Code Climate](https://codeclimate.com/github/RackHD/on-core/badges/gpa.svg)](https://codeclimate.com/github/RackHD/on-core) [![Coverage Status](https://coveralls.io/repos/RackHD/on-core/badge.svg?branch=master&service=github)](https://coveralls.io/github/RackHD/on-core?branch=master)

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

The following configuration values can be overridden via the environment, command line, or via the global configuration file located at /opt/monorail/config.json.

The global configuration file location can be overridden by setting a new configuration file value in the environment using the MONORAIL_CONFIG environment variable.

## amqp

Defaults to `amqp://localhost`.

## mongo

Defaults to `mongodb://localhost/pxe`.

## statsd

Defaults to `localhost:8125`.

## sharedKey

A 32 bit base64 encoded string, defaults to `qxfO2D3tIJsZACu7UA6Fbw0avowo8r79ALzn+WeuC8M=`.

## Licensing

Licensed under the Apache License, Version 2.0 (the “License”); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

RackHD is a Trademark of Dell EMC

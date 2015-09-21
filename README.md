Copyright 2015, EMC, Inc.

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

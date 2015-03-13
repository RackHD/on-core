// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di'),
    util = require('util');

module.exports = IpAddressFactory;

di.annotate(IpAddressFactory, new di.Provide('IpAddress'));
di.annotate(IpAddressFactory,
    new di.Inject(
        'Assert',
        'Serializable'
    )
);

function IpAddressFactory (assert, Serializable) {
    function IpAddress (defaults) {
        Serializable.call(
            this,
            {
                id: 'IpAddress',
                type: 'object',
                properties: {
                    value: {
                        type: 'string',
                        format: 'ipv4'
                    }
                },
                required: [ 'value' ]
            },
            defaults
        );
    }

    util.inherits(IpAddress, Serializable);

    Serializable.register(IpAddressFactory, IpAddress);

    return IpAddress;
}

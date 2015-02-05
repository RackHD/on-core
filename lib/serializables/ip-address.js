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
                value: {
                    type: 'string',
                    required: true,
                    ipv4: true
                }
            },
            defaults
        );
    }

    util.inherits(IpAddress, Serializable);

    Serializable.register(IpAddressFactory, IpAddress);

    return IpAddress;
}
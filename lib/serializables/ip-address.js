// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

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
            IpAddress.schema,
            defaults
        );
    }

    IpAddress.schema = {
        id: 'IpAddress',
        type: 'object',
        properties: {
            value: {
                type: 'string',
                format: 'ipv4'
            }
        },
        required: [ 'value' ]
    };

    Serializable.register(IpAddressFactory, IpAddress);

    return IpAddress;
}


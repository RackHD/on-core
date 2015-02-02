// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di'),
    util = require('util');

module.exports = MacAddressFactory;

di.annotate(MacAddressFactory, new di.Provide('MacAddress'));
di.annotate(MacAddressFactory,
    new di.Inject(
        'Assert',
        'Serializable'
    )
);

function MacAddressFactory (assert, Serializable) {
    function MacAddress (defaults) {
        Serializable.call(
            this,
            {
                value: {
                    type: 'string',
                    required: true,
                    macaddress: true
                }
            },
            defaults
        );
    }

    util.inherits(MacAddress, Serializable);

    Serializable.register(MacAddressFactory, MacAddress);

    return MacAddress;
}
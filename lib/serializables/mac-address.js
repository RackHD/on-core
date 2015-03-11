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
                id: 'MacAddress',
                type: 'object',
                properties: {
                    value: {
                        type: 'string',
                        pattern: '^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$'
                    }
                },
                required: [ 'value' ]
            },
            defaults
        );
    }

    util.inherits(MacAddress, Serializable);

    Serializable.register(MacAddressFactory, MacAddress);

    return MacAddress;
}

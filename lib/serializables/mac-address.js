// Copyright (c) 2015, EMC Corporation
/* jshint: node:true */

'use strict';

var di = require('di');

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
            MacAddress.schema,
            defaults
        );
    }

    MacAddress.schema = {
        id: 'MacAddress',
        type: 'object',
        properties: {
            value: {
                type: 'string',
                pattern: '^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$'
            }
        },
        required: [ 'value' ]
    };

    Serializable.register(MacAddressFactory, MacAddress);

    return MacAddress;
}


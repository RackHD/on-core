// Copyright 2015, EMC, Inc.

'use strict';

module.exports = IpAddressFactory;

IpAddressFactory.$provide = 'IpAddress';
IpAddressFactory.$inject = [
    'Assert',
    'Serializable'
];

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

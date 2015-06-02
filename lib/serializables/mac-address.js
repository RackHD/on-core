// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = MacAddressFactory;

MacAddressFactory.$provide = 'MacAddress';
MacAddressFactory.$inject = [
    'Assert',
    'Serializable'
];

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

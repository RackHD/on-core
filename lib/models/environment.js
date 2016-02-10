// Copyright 2016, EMC, Inc.

'use strict';

module.exports = EnvModelFactory;

EnvModelFactory.$provide = 'Models.Environment';
EnvModelFactory.$inject = [
    'Model'
];

function EnvModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'environment',
        attributes: {
            identifier: {
                type: 'string',
                required: true
            },
            data: {
                type: 'json',
                required: true,
                json: true
            }
        }
    });
}

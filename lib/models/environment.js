// Copyright 2016, EMC, Inc.

'use strict';

module.exports = EnvModelFactory;

EnvModelFactory.$provide = 'Models.Environment';
EnvModelFactory.$inject = [
    'Model',
    'Services.Configuration'
];

function EnvModelFactory (Model, configuration) {
    return Model.extend({
        connection: configuration.get('databaseType', 'mongo'),
        identity: 'environment',
        attributes: {
            identifier: {
                type: 'string',
                required: true,
                primaryKey: true,
                unique: true
            },
            data: {
                type: 'json',
                required: true,
                json: true
            }
        },
        $indexes: [
            {
                keys: { identifier: 1 },
                options: { unique: true }
            }
        ]
    });
}

// Copyright 2016, EMC, Inc.

'use strict';

module.exports = HooksModelFactory;

HooksModelFactory.$provide = 'Models.Hooks';
HooksModelFactory.$inject = [
    'Model',
    'Services.Configuration',
    'uuid'
];

function HooksModelFactory (Model, configuration, uuid) {

    return Model.extend({
        connection: configuration.get('databaseType', 'mongo'),
        identity: 'hooks',
        attributes: {
            id: {
                type: 'string',
                uuidv4: true,
                primaryKey: true,
                unique: true,
                required: true,
                defaultsTo: function() { return uuid.v4(); }
            },
            name: {
                type: 'string',
                required: false
            },
            url: {
                type: 'string',
                required: true
            },
            filters: {
                type: 'array',
                required: false,
                defaultsTo: []
            }
        }
    });
}

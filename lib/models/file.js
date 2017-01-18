// Copyright 2015, EMC, Inc.

'use strict';

module.exports = FileModelFactory;

FileModelFactory.$provide = 'Models.File';
FileModelFactory.$inject = [
    'Model',
    'Services.Configuration'
];

function FileModelFactory (Model, configuration) {
    return Model.extend({
        connection: configuration.get('databaseType', 'mongo'),
        identity: 'files',
        tableName: 'files',
        attributes: {
            basename: {
                type: 'string',
                required: true,
                primaryKey: true
            },

            filename: {
                type: 'string',
                required: true
            },

            uuid: {
                type: 'string',
                required: true,
                uuidv4: true
            },

            md5: {
                type: 'string',
                required: true
            },

            sha256: {
                type: 'string',
                required: true
            },

            version: {
                type: 'integer',
                defaultsTo: 0
            },

            toJSON: function() {
                var obj = this.toObject();
                delete obj.id;
                delete obj.createdAt;
                delete obj.updatedAt;
                return obj;
            }
        },
        $indexes: [
            {
                keys: { basename: 1 },
                options: { unique: true }
            }
        ]
    });
}

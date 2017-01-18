// Copyright 2015, EMC, Inc.

'use strict';

module.exports = GraphModelFactory;

GraphModelFactory.$provide = 'Models.GraphDefinition';
GraphModelFactory.$inject = [
    'Model',
    'Services.Configuration'
];

function GraphModelFactory (Model, configuration) {
    return Model.extend({
        connection: configuration.get('taskgraph-store', 'mongo'),
        identity: 'graphdefinitions',
        attributes: {
            friendlyName: {
                type: 'string',
                required: true
            },
            injectableName: {
                type: 'string',
                required: true
            },
            tasks: {
                type: 'array',
                required: true,
                json: true
            },
            toJSON: function() {
                // Remove waterline keys that we don't want in our graph objects
                var obj = this.toObject();
                delete obj.createdAt;
                delete obj.updatedAt;
                delete obj.id;
                return obj;
            }
        },
        $indexes: [
            {
                keys: { injectableName: 1 },
                options: { unique: true }
            }
        ]
    });
}

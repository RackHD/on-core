// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = GraphModelFactory;

GraphModelFactory.$provide = 'Models.GraphDefinition';
GraphModelFactory.$inject = [
    'Model'
];

function GraphModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'graphdefinitions',
        attributes: {
            friendlyName: {
                type: 'string',
                required: true
            },
            injectableName: {
                type: 'string',
                required: true,
                unique: true
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
        }
    });
}

// Copyright 2015, EMC, Inc.

'use strict';

module.exports = GraphModelFactory;

GraphModelFactory.$provide = 'Models.GraphObject';
GraphModelFactory.$inject = [
    'Model'
];

function GraphModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'graphobjects',
        attributes: {
            instanceId: {
                type: 'string',
                required: true,
                unique: true,
                uuidv4: true
            },
            context: {
                type: 'json',
                required: true,
                json: true
            },
            definition: {
                type: 'json',
                required: true,
                json: true
            },
            tasks: {
                type: 'json',
                required: true,
                json: true
            },
            node: {
                model: 'nodes'
            }
        }
    });
}

// Copyright 2015, EMC, Inc.

'use strict';

module.exports = GraphModelFactory;

GraphModelFactory.$provide = 'Models.GraphObject';
GraphModelFactory.$inject = [
    'Model',
    'Constants',
    'Services.Configuration'
];

function GraphModelFactory (Model, Constants, configuration) {
    return Model.extend({
        connection: configuration.get('taskgraph-store', 'mongo'),
        identity: 'graphobjects',
        attributes: {
            instanceId: {
                type: 'string',
                required: true,
                unique: true,
                uuidv4: true,
                index: true
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
            },
            parentTaskId: {
                type: 'string',
                uuidv4: true
            },
            parentGraphId: {
                type: 'string',
                uuidv4: true
            },
            active: function() {
                var obj = this.toObject();
                return Constants.Task.ActiveStates.indexOf(obj._status) > -1;
            }
        }
    });
}

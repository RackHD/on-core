// Copyright 2015, EMC, Inc.

'use strict';

module.exports = TaskModelFactory;

TaskModelFactory.$provide = 'Models.TaskDefinition';
TaskModelFactory.$inject = [
    'Model',
    'Services.Configuration'
];

function TaskModelFactory (Model, configuration) {
    return Model.extend({
        connection: configuration.get('taskgraph-store', 'mongo'),
        identity: 'taskdefinitions',
        attributes: {
            friendlyName: {
                type: 'string',
                required: true
            },
            injectableName: {
                type: 'string',
                required: true,
                unique: true,
            },
            implementsTask: {
                type: 'string',
                required: true
            },
            options: {
                type: 'json',
                required: true,
                json: true
            },
            properties: {
                type: 'json',
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

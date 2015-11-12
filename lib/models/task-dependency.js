// Copyright 2015, EMC, Inc.

'use strict';

module.exports = TaskDependencyFactory;

TaskDependencyFactory.$provide = 'Models.TaskDependency';
TaskDependencyFactory.$inject = [
    'Model',
    'Constants'
];

function TaskDependencyFactory (Model, Constants) {
    return Model.extend({
        connection: 'mongo',
        identity: 'taskdependencies',
        attributes: {
            domain: {
                type: 'string',
                defaultsTo: Constants.DefaultTaskDomain
            },
            graphId: {
                type: 'string',
                required: true
            },
            state: {
                type: 'string',
                required: true
            },
            evaluated: {
                type: 'boolean',
                defaultsTo: false
            },
            reachable: {
                type: 'boolean',
                defaultsTo: true
            },
            taskRunnerLease: {
                type: 'string',
                defaultsTo: null
            },
            taskRunnerHeartbeat: {
                type: 'date',
                defaultsTo: null
            },
            dependencies: {
                type: 'json',
                required: true
            },
            toJSON: function() {
                // Remove waterline keys that we don't want in our dependency object
                var obj = this.toObject();
                delete obj.createdAt;
                delete obj.updatedAt;
                delete obj.id;
                return obj;
            }
        }
    });
}

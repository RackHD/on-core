// Copyright 2015, EMC, Inc.

'use strict';

module.exports = TaskDependencyFactory;

TaskDependencyFactory.$provide = 'Models.TaskDependency';
TaskDependencyFactory.$inject = [
    'Model'
];

function TaskDependencyFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'taskdependencies',
        attributes: {
            instanceId: {
                type: 'string',
                required: true
            },
            graphId: {
                type: 'string',
                required: true
            },
            state: {
                type: 'string',
                required: true
            },
            schedulerLease: {
                type: 'string',
                defaultsTo: null
            },
            taskRunnerLease: {
                type: 'string',
                defaultsTo: null
            },
            schedulerHeartbeat: {
                type: 'date',
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

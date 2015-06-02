// Copyright (c) 2015, EMC Corporation


'use strict';

var di = require('di');

module.exports = TaskModelFactory;

di.annotate(TaskModelFactory, new di.Provide('Models.TaskDefinition'));
di.annotate(TaskModelFactory, new di.Inject(
        'Model'
    )
);

function TaskModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
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

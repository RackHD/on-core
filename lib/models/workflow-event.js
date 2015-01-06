// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = WorkflowEventModelFactory;

di.annotate(WorkflowEventModelFactory, new di.Provide('Models.WorkflowEvent'));
di.annotate(WorkflowEventModelFactory, new di.Inject(
        'Model'
    )
);

function WorkflowEventModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'workflowevents',
        attributes: {
            workflow: {
                model: 'workflows',
                required: true
            },
            instance: {
                type: 'string',
                required: true,
                uuidv4: true
            },
            data: {
                type: 'json',
                required: true,
                json: true
            },
            type: {
                type: 'string',
                required: true,
                in: [
                    'started',
                    'transitioned',
                    'completed',
                    'failed'
                ]
            }
        }
    });
}
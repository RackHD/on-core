// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = WorkflowModelFactory;

di.annotate(WorkflowModelFactory, new di.Provide('Models.Workflow'));
di.annotate(WorkflowModelFactory, new di.Inject(
        'Constants',
        'Model',
        'Q'
    )
);

function WorkflowModelFactory (Constants, Model, Q) {
    return Model.extend({
        connection: 'mongo',
        identity: 'workflows',
        attributes: {
            node: {
                model: 'nodes'
            },
            instance: {
                type: 'string',
                unique: true,
                required: true,
                uuidv4: true
            },
            name: {
                type: 'string',
                required: true
            },
            context: {
                type: 'json',
                json: true
            },
            state: {
                type: 'string',
                required: true
            },
            startedAt: {
                type: 'datetime',
                defaultsTo: function () {
                    return new Date().toISOString();
                }
            },
            completedAt: {
                type: 'datetime'
            },
            failedAt: {
                type: 'datetime'
            },
            error: {
                type: 'json',
                json: true
            },
            type: {
                type: 'string',
                in: [
                    Constants.PARENT_WORKFLOW_TYPE,
                    Constants.CHILD_WORKFLOW_TYPE
                ],
                required: true
            },
            parent: {
                model: 'workflows'
            },
            workflows: {
                collection: 'workflows',
                via: 'parent'
            },
            events: {
                collection: 'workflowevents',
                via: 'workflow'
            }
        },
        // afterUpdate: function (record, next) {
        //     postal.publish({
        //         channel: record.node,
        //         topic: Constants.WORKFLOW_PROGRESS_TOPIC,
        //         data: record
        //     });

        //     this.publishRecord('updated', record, next);
        // },
        failAllIncomplete: function failAllIncomplete() {
            // TODO: waterline query to update all incomplete workflows on startup
            return Q.resolve(0);
        }
    });
}
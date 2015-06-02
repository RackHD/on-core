// Copyright (c) 2015, EMC Corporation


'use strict';

var di = require('di');

module.exports = NodeModelFactory;

di.annotate(NodeModelFactory, new di.Provide('Models.Node'));
di.annotate(NodeModelFactory, new di.Inject(
        'Model'
    )
);

function NodeModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'nodes',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            obmSettings: {
                type: 'json',
                required: false,
                json: true
            },
            type: {
                type: 'string',
                enum: [ 'compute', 'switch', 'dae', 'pdu' ],
                defaultsTo: 'compute'
            },
            workflows: {
                collection: 'graphobjects',
                via: 'node'
            },
            catalogs: {
                collection: 'catalogs',
                via: 'node'
            },
            sku: {
                model: 'skus'
            }
        }
    });
}


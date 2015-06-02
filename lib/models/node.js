// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = NodeModelFactory;

NodeModelFactory.$provide = 'Models.Node';
NodeModelFactory.$inject = [
    'Model'
];

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

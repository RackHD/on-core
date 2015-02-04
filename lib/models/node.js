// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

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
            profile: {
                type: 'string',
                required: true,
                defaultsTo: 'diskboot.ipxe'
            },
            name: {
                type: 'string',
                required: true
            },
            obmSettings: {
                type: 'json',
                required: false,
                json: true
            },
            ipAddresses: {
                type: 'json',
                required: false,
                json: true
            },
            workflows: {
                collection: 'graphobjects',
                via: 'nodes',
                dominant: true
            },
            catalogs: {
                collection: 'catalogs',
                via: 'node'
            },
            sku: {
                type: 'string',
                required: true,
                defaultsTo: 'unknown'
            }
        }
    });
}

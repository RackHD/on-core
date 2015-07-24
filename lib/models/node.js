// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = NodeModelFactory;

NodeModelFactory.$provide = 'Models.Node';
NodeModelFactory.$inject = [
    'Model',
    'Services.Waterline',
    '_'
];

function NodeModelFactory (Model, waterline, _) {
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
            },
            snmpSettings: {
                type: 'json',
                json: true,
                required: false
            },
            autoDiscover: {
                type: 'boolean',
                defaultsTo: false
            },
            // We only count a node as having been discovered if
            // a node document exists AND it has any catalogs
            // associated with it
            discovered: function() {
                var self = this;
                return waterline.catalogs.findOne({"node": self.id})
                .then(function(catalog) {
                    return !_.isEmpty(catalog);
                });
            }
        }
    });
}

// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = CatalogModelFactory;

di.annotate(CatalogModelFactory, new di.Provide('Models.Catalog'));
di.annotate(CatalogModelFactory, new di.Inject(
        'Model'
    )
);

function CatalogModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'catalogs',
        attributes: {
            node: {
                model: 'nodes',
                required: true
            },
            source: {
                type: 'string',
                required: true
            },
            data: {
                type: 'json',
                required: true,
                json: true
            }
        }
    });
}
// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = CatalogModelFactory;

di.annotate(CatalogModelFactory, new di.Provide('Models.Catalog'));
di.annotate(CatalogModelFactory, new di.Inject(
        'Model',
        '_'
    )
);

function CatalogModelFactory (Model, _) {
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
        },
        beforeCreate: function(values, cb) {
            values.data = updateKeys(values.data, _);
            cb();
        },

        /**
         * Retrieves the most recent catalog of the source identified for the given node
         *
         * @param nodeId {string}
         * @param source {string}
         */
        findLatestCatalogOfSource: function findLatestCatalog(nodeId, source) {
            return this.findMostRecent({
                node: nodeId,
                source: source
            });
        }
    });
}

/*
 * Change all key values containing '.' to '_', since the driver won't allow
 * keys with dots by default
 */
function updateKeys(obj, _) {
    var newObj = null;
    if (_.isArray(obj)) {
        newObj = [];
    } else if (_.isObject(obj)) {
        newObj = {};
    } else {
        return obj;
    }
    _.forEach(obj, function(value, key) {
        if (key.replace) {
            var newKey = key.replace(/\$|\./g, '_');
            newObj[newKey] = updateKeys(value, _);
        } else {
            newObj[key] = updateKeys(value, _);
        }
    });
    return newObj;
}

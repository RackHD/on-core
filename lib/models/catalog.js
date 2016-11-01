// Copyright 2015, EMC, Inc.

'use strict';

module.exports = CatalogModelFactory;

CatalogModelFactory.$provide = 'Models.Catalog';
CatalogModelFactory.$inject = [
    'Model',
    '_',
    'Services.Configuration',
    'uuid'
];

function CatalogModelFactory (
    Model,
    _,
    configuration,
    uuid
) {
    return Model.extend({
        connection: configuration.get('databaseType', 'mongo'),
        identity: 'catalogs',
        attributes: {
            id: {
                type: 'string',
                uuidv4: true,
                primaryKey: true,
                unique: true,
                required: true,
                defaultsTo: function() { return uuid.v4(); }
            },
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

        $indexes: [
            {
                keys: { node: 1 }
            },
            {
                keys: { source: 1 }
            },
            {
                keys: { node: 1, source: 1 },
                options: { unique: false } //not unique index since we allow old catalogs exist
            }
        ],

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

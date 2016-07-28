// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ModelFactory;

ModelFactory.$provide = 'Model';
ModelFactory.$inject = [
    'pluralize',
    'Promise',
    '_',
    'Util',
    'Assert',
    'Errors',
    'Waterline',
    'Protocol.Waterline',
    'Services.Waterline'
];

function ModelFactory (
    pluralize,
    Promise,
    _,
    util,
    assert,
    Errors,
    Waterline,
    waterlineProtocol,
    waterline
) {
    var url = require('url');

    function byLastUpdated(lastUpdated) {
        return { updatedAt: { '>': lastUpdated } };
    }

    return Waterline.Collection.extend({
        attributes: {
            identifiers: {
                type: 'array',
                required: false
            },
            properties: {
                type: 'json',
                required: false,
                json: true
            }
        },

        publishRecord: function (event, record, id) {
            if (!id && this.attributes && this.attributes.instanceId) {
                id = record && record.instanceId;
            }
            return waterlineProtocol.publishRecord(this, event, record || {}, id || '');
        },

        afterCreate: function (record, next) {
            this.publishRecord('created', record)
            .then(function () {
                next();
            }).catch(function (err) {
                next(err);
            });
        },
        afterUpdate: function (record, next) {
            this.publishRecord('updated', record)
            .then(function () {
                next();
            }).catch(function (err) {
                next(err);
            });
        },
        afterDestroy: function (records, next) {
            var self = this;

            Promise.all(_.map(records, function (record) {
                return self.publishRecord('destroyed', record);
            }))
            .then(function () {
                next();
            }).catch(function (err) {
                next(err);
            });
        },

        addWaterlineUpdatedAtToObject: function(obj, prop) {
            if (prop && obj[prop]) {
                if (!obj[prop].updatedAt) {
                    obj[prop].updatedAt = new Date();
                }
            } else if (!obj.updatedAt && !prop) {
                obj.updatedAt = new Date();
            }
        },

        addWaterlineCreatedAtToObject: function(obj, prop) {
            if (prop && obj[prop]) {
                if (!obj[prop].createdAt) {
                    obj[prop].createdAt = new Date();
                }
            } else if (!obj.createdAt) {
                obj.createdAt = new Date();
            }
        },

        runNativeMongo: function(func, args) {
            args = Array.isArray(args) ? args : [args];
            return Promise.fromNode(this.native.bind(this))
            .then(function(collection) {
                return collection[func].apply(collection, args);
            })
            .then(function(doc) {
                if (doc && _.has(doc, 'value')) {
                    return doc.value;
                } else {
                    // This is for calls like find that return a cursor object
                    // and not a result object
                    return doc;
                }
            });
        },

        createMongoIndexes: function() {
            return Promise.map(_.values(arguments), this.runNativeMongo.bind(this, 'createIndex'));
        },

        createUniqueMongoIndexes: function(indexes) {
            var self = this;
            return Promise.map(indexes, function(index) {
                return self.runNativeMongo('createIndex', [index, { unique: true }]);
            });
        },

        runQuery: function( querystr, params ) {
            return Promise.fromNode(this.query.bind(this, querystr, params));
        },

        postgresqlRunLockedQuery: function(querystr, params) {
            var self = this;
            var pg = Promise.promisifyAll(require('pg'));
            var connectionConfig = self.connections.postgresql.config;
            if(_.has(connectionConfig, 'url')) {
                var connectionUrl = url.parse(connectionConfig.url);
                connectionUrl.query = _.omit(connectionConfig, 'url');
                connectionConfig = url.format(connectionUrl);
            }
            return pg.connectAsync(connectionConfig)
            .spread(function(client, done) {
                var queryAsync = Promise.promisify(client.query);
                var queryList = [
                    ['BEGIN'],
                    ['LOCK TABLE ' + self.identity + ' IN EXCLUSIVE MODE'],
                    [querystr, params],
                    ['COMMIT']
                ];
                return Promise.reduce(queryList, function(rows, query) {
                    return queryAsync.apply(client, query)
                    .then(function(row) {
                        rows.push(row);
                        return rows;
                    });
                }, [])
                .then(function(rows) {
                    done();
                    return rows;
                });
            });
        },

        findMongo: function(query, options) {
            return this.runNativeMongo('find', [query])
            .then(function(cursor) {
                if (options && options.limit) {
                    cursor = cursor.limit(options.limit);
                }
                if(options && options.sort) {
                    cursor = cursor.sort(options.sort);
                }
                return cursor.toArray();
            });
        },

        findOneMongo: function(query) {
            return this.runNativeMongo('findOne', [query]);
        },

        findAndModifyMongo: function() {
            var self = this;

            // Take query and sort arguments off so we can modify the update arg
            var _arguments = Array.prototype.slice.call(arguments);
            var args = _arguments.slice(1);
            if (args.length) {
                args.shift();
            }
            var update = args.shift();

            // Don't validate if we're setting/unsetting individual properties
            if (update.$set || update.$setOnInsert) {
                if (update.$setOnInsert) {
                    this.addWaterlineCreatedAtToObject(update, '$setOnInsert');
                    update.$set = update.$set || {};
                }
                if (update.$set) {
                    this.addWaterlineUpdatedAtToObject(update, '$set');
                }
                return self.runNativeMongo('findAndModify', _arguments);
            }

            // Don't validate if we're setting/unsetting individual properties
            if (update.$unset) {
                if (!update.$set) {
                    update.$set = {};
                }
                this.addWaterlineUpdatedAtToObject(update, '$set');
                return self.runNativeMongo('findAndModify', _arguments);
            }

            this.addWaterlineUpdatedAtToObject(update);
            this.addWaterlineCreatedAtToObject(update);

            return Promise.fromNode(self.validate.bind(this, update))
            .then(function() {
                return self.runNativeMongo('findAndModify', _arguments);
            });
        },

        updateMongo: function(filter, update, options) {
            var self = this;

            if (update.$set || update.$unset) {
                this.addWaterlineUpdatedAtToObject(update, '$set');
                this.addWaterlineUpdatedAtToObject(update, '$unset');
                return self.runNativeMongo('update', [filter, update, options]);
            }
            this.addWaterlineUpdatedAtToObject(update);

            return Promise.fromNode(self.validate.bind(this, update))
            .then(function() {
                return self.runNativeMongo('update', [filter, update, options]);
            });
        },

        removeMongo: function(query) {
            return this.runNativeMongo('remove', [query]);
        },

        /**
         * Look up by identifier - either the "id" or in the identifiers array.
         * Returns a waterline (bluebird) promise that will resolve the promise.
         *
         * @param {string} identifier
         * @returns {Deferred}
         */
        findByIdentifier: function (identifier) {
            var self = this;

            // Search for Lookup records associated with the identifier (id, macAddress, ipAddress).
            return waterline.lookups.findByTerm(identifier).then(function (documents) {
                // Identify a record with a node id.
                var lookup = _.find(documents, function (item) {
                    return item.node !== undefined;
                });
                // If we find a record with a node id then we can lookup the node with it,
                // otherwise we can try to lookup with the identifier directly.
                if (lookup) {
                    return self.findOne({ id: lookup.node });
                } else {
                    return self.findOne({ id: identifier })
                    .then(function(rec) {
                        if(!rec) {
                            return self.findOne({identifiers: identifier});
                        }
                        return rec;
                    });
                }
            });
        },
        /**
         * Look up by identifier - either the "id" or in the identifiers array.
         * Returns a waterline (bluebird) promise that will resolve the promise.
         * Rejects the promise if the document was not found.
         *
         * @param {string} identifier
         * @returns {Deferred}
         */
        needByIdentifier: function (identifier) {
            var self = this;

            return this.findByIdentifier(identifier).then(function (record) {
                if (!record) {
                    throw new Errors.NotFoundError(
                        'Could not find %s with identifier %s'.format(
                            pluralize.singular(self.identity),
                            identifier
                        ), {
                            identifier: identifier,
                            collection: self.identity
                        });
                }

                return record;
            });
        },
        /**
         * Look up and update values by identifier - either the "id" or in the identifiers array.
         * Returns a waterline (bluebird) promise with the record updated.
         * Rejects the promise if the document was not found.
         *
         * @param {string} identifier
         * @param {Object} values
         * @returns {Deferred}
         */
        updateByIdentifier: function (identifier, values) {
            var self = this;

            return self.needByIdentifier(identifier)
                .then(function (record) {
                    return self.update(
                        record.id,
                        values
                    ).then(function (records) {
                        return records[0];
                    });
                });
        },
        /**
         * Look up and remove objects by identifier - either the "id" or in the identifiers array.
         * Returns a waterline (bluebird) promise with the record deleted
         * Rejects the promise if the document was not found.
         * @param {string} identifier
         * @returns {Deferred}
         */
        destroyByIdentifier: function (identifier) {
            var self = this;

            return self.needByIdentifier(identifier)
                .then(function (record) {
                    return self.destroy(
                       record.id
                    ).then(function (records) {
                        return records[0];
                    });
                });
        },
        /**
         * Using an identifier, find and update, or create a new instance if none exists
         * using the values provided. Returns a waterline (bluebird) promise with the record
         * created or updated.
         *
         * @param {string} identifier
         * @param {Object} values
         * @returns {Deferred}
         */
        findOrCreateByIdentifier: function (identifier, values) {
            var self = this;

            return this.findByIdentifier(identifier).then(function (record) {
                if (record) {
                    return record;
                } else {
                    return self.create(values);
                }
            });
        },
        /**
         * Extend a criteria object with additional waterline query paramters to
         * find the single most recently updated object that matches the criteria.
         * Returns the waterline (bluebird) promise from the find method with the
         * extended criteria.
         *
         * @param {Object} criteria
         * @returns {Deferred}
         */
        findMostRecent: function (criteria) {
            return this.find(
                { where: criteria, limit: 1, sort: { createdAt: -1 } }
            ).then(function (records) {
                return records[0];
            });
        },
        /**
         * Extend a criteria object with additional waterline query paramters to
         * find all records that have been modified after the provided date.
         * Returns the waterline (bluebird) promise from the find method with the
         * extended criteria.
         *
         * @param {Date} lastUpdated
         * @param {Object} criteria
         * @returns {Deferred}
         */
        findSinceLastUpdate: function (lastUpdated, criteria) {
            assert.isDate(lastUpdated);

            return this.find(_.merge({}, criteria, byLastUpdated(lastUpdated)));
        },

        /**
         * Find a single document via criteria and resolve it, otherwise
         * reject with a NotFoundError.
         */
        needOne: function (criteria) {
            var identity = this.identity;

            return this.findOne(criteria).then(function (record) {
                if (!record) {
                    throw new Errors.NotFoundError(
                        'Could not find %s with criteria %j.'.format(
                            pluralize.singular(identity),
                            criteria
                        ), {
                            criteria: criteria,
                            collection: identity
                        });
                }

                return record;
            });
        },

        /**
         * Find a single document by ID and resolve it, otherwise reject
         * with a NotFoundError.
         */
        needOneById: function (id) {
            return this.needOne({ id: id });
        },

        /**
         * Update a single document by criteria and resolve it, otherwise
         * reject with a NotFoundError.
         */
        updateOne: function (criteria, document) {
            var self = this;

            return this.needOne(criteria).then(function (target) {
                return self.update(target.id, document).then(function (documents) {
                    return documents[0];
                });
            });
        },

        /**
         * Update a single document by ID and resolve it, otherwise
         * reject with a NotFoundError.
         */
        updateOneById: function (id, document) {
            return this.updateOne({ id: id }, document);
        },

        /**
         * Destroy a single document by criteria and resolve it, otherwies
         * reject with a NotFoundError.
         */
        destroyOne: function (criteria) {
            var self = this;

            return this.needOne(criteria).then(function (target) {
                return self.destroy(target.id).then(function (documents) {
                    return documents[0];
                });
            });
        },

        /**
         * Destroy a single document by ID and resolve it, otherwise
         * reject with a NotFoundError.
         */
        destroyOneById: function (id) {
            return this.destroyOne({ id: id });
        }
    });
}

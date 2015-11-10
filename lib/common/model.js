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
    function byIdentifier(identifier) {
        return {
            or: [
                { id: identifier },
                { identifiers: identifier }
            ]
        };
    }

    function byLastUpdated(lastUpdated) {
        return {
            or: [
                { createdAt: { '>': lastUpdated } },
                { updatedAt: { '>': lastUpdated } }
            ]
        };
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

        afterCreate: function (record, next) {
            waterlineProtocol.publishRecord(this, 'created', record)
            .then(function () {
                next();
            }).catch(function (err) {
                next(err);
            });
        },
        afterUpdate: function (record, next) {
            waterlineProtocol.publishRecord(this, 'updated', record)
            .then(function () {
                next();
            }).catch(function (err) {
                next(err);
            });
        },
        afterDestroy: function (records, next) {
            var self = this;

            Promise.all(_.map(records, function (record) {
                return waterlineProtocol.publishRecord(self, 'destroyed', record);
            }))
            .then(function () {
                next();
            }).catch(function (err) {
                next(err);
            });
        },

        addWaterlineDatesAsMongoModifiers: function(obj) {
            obj.$set = obj.$set || {};
            if (!obj.$set.updatedAt) {
                obj.$set.updatedAt = new Date();
            }
        },

        addWaterlineUpdatedAtToObject: function(obj) {
            if (!obj.updatedAt) {
                obj.updatedAt = new Date();
            }
        },

        addWaterlineCreatedAtToObject: function(obj) {
            if (!obj.createdAt) {
                obj.createdAt = new Date();
            }
        },

        runNativeMongo: function(func, args) {
            return Promise.fromNode(this.native.bind(this))
            .then(function(collection) {
                // TODO: when we update to the more recent node-mongo-native versions
                // (either when we update sails-mongo or get rid of it), then we can
                // take advantage of promise-returning support and not
                // have to deal with this callback hackery.
                return new Promise(function(resolve, reject) {
                    args.push(function(err, result) {
                        if (err) {
                            reject(err);
                        }
                        resolve(result);
                    });
                    collection[func].apply(collection, args);
                });
            });
        },

        findOneMongo: function(query) {
            return this.runNativeMongo('findOne', query);
        },

        findAndModifyMongo: function() {
            // Take query and sort arguments off so we can modify the update arg
            var args = Array.prototype.slice.call(arguments, 1);
            if (args.length) {
                args.shift();
            }
            var update = args.shift();
            if (update.$set) {
                this.addWaterlineDatesAsMongoModifiers(update);
            } else {
                this.addWaterlineUpdatedAtToObject(update);
                this.addWaterlineCreatedAtToObject(update);
            }
            return this.runNativeMongo('findAndModify', Array.prototype.slice.call(arguments));
        },

        updateManyMongo: function(filter, update, options) {
            if (update.$set) {
                this.addWaterlineDatesAsMongoModifiers(update);
            } else {
                this.addWaterlineUpdatedAtToObject(update);
            }
            options.multi = true;
            return this.runNativeMongo('update', [filter, update, options]);
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
                    return self.findOne({
                        where: byIdentifier(identifier)
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

            return this.find({
                where: {
                    $and: [
                        criteria,
                        byLastUpdated(lastUpdated)
                    ]
                }
            });
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


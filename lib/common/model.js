// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = ModelFactory;

di.annotate(ModelFactory, new di.Provide('Model'));
di.annotate(ModelFactory,
    new di.Inject(
        'Q',
        '_',
        'Assert',
        'Waterline',
        'Protocol.Waterline'
    )
);

function ModelFactory (Q, _, assert, Waterline, waterlineProtocol) {
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

            Q.all(_.map(records, function (record) {
                return waterlineProtocol.publishRecord(self, 'destroyed', record);
            }))
            .then(function () {
                next();
            }).catch(function (err) {
                next(err);
            });

        },

        /**
         * Look up by identifier - either the "id" or in the identifiers array.
         * Returns a waterline (bluebird) promise that will resolve the promise.
         *
         * @param {string} identifier
         * @returns {Deferred}
         */
        findByIdentifier: function (identifier) {
            return this.findOne({
                where: byIdentifier(identifier)
            });
        },
        /**
         * Look up and update values by identifier - either the "id" or in the identifiers array.
         * Returns a waterline (bluebird) promise with the record updated.
         *
         * @param {string} identifier
         * @param {Object} values
         * @returns {Deferred}
         */
        updateByIdentifier: function (identifier, values) {
            return this.update(
                byIdentifier(identifier),
                values
            ).then(function (records) {
                // TODO: make this work on one record only.
                return records[0];
            });
        },
        /**
         * Look up and remove objects by identifier - either the "id" or in the identifiers array.
         * Returns a waterline (bluebird) promise with the record deleted
         * @param {string} identifier
         * @returns {Deferred}
         */
        destroyByIdentifier: function (identifier) {
            return this.destroy(
                byIdentifier(identifier)
            ).then(function (records) {
                // TODO: make this work on one record only.
                return records[0];
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
        }
    });
}

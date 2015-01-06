// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

Error.stackTraceLimit = Infinity;

var di = require('di');

module.exports = ModelFactory;

di.annotate(ModelFactory, new di.Provide('Model'));
di.annotate(ModelFactory,
    new di.Inject(
        'Waterline'
    )
);

function ModelFactory (Waterline) {
    function byIdentifier(identifier) {
        return {
            or: [
                { id: identifier },
                { identifiers: identifier }
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
        // publishRecord: function (event, record, next) {
        //     postal.publish({
        //         channel: 'waterline',
        //         topic: this.identity + '.' + event + '.' + record.id,
        //         data: record
        //     });

        //     if (_.isFunction(next)) {
        //         next();
        //     }
        // },
        // afterCreate: function (record, next) {
        //     this.publishRecord('created', record, next);
        // },
        // afterUpdate: function (record, next) {
        //     this.publishRecord('updated', record, next);
        // },
        // afterDestroy: function (records, next) {
        //     records.forEach(this.publishRecord.bind(this, 'destroyed'));
        //     if (_.isFunction(next)) {
        //         next();
        //     }
        // },
        findByIdentifier: function (identifier) {
            return this.findOne(
                byIdentifier(identifier)
            );
        },
        updateByIdentifier: function (identifier, values) {
            return this.update(
                byIdentifier(identifier),
                values
            ).then(function (records) {
                // TODO: make this work on one record only.
                return records[0];
            });
        },
        destroyByIdentifier: function (identifier) {
            return this.destroy(
                byIdentifier(identifier)
            ).then(function (records) {
                // TODO: make this work on one record only.
                return records[0];
            });
        },
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
        findMostRecent: function (criteria) {
            return this.find(
                { where: criteria, limit: 1, sort: { createdAt: -1 } }
            );
        }
        // subscribe: function (query, options) {
        //     return pubsubService.subscribe(this, query, options);
        // }
    });
}
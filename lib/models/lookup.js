// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = LookupModelFactory;

di.annotate(LookupModelFactory, new di.Provide('Models.Lookup'));
di.annotate(LookupModelFactory, new di.Inject(
        'Model'
    )
);

function LookupModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'lookups',
        attributes: {
            node: {
                model: 'nodes'
            },
            ipAddress: {
                type: 'string',
                unique: true,
                regex: /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/
            },
            macAddress: {
                type: 'string',
                unique: true,
                required: true,
                regex: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
            }
        },
        findByTerm: function (term) {
            return this.find({
                or: [
                    { node: term },
                    { macAddress: term },
                    { ipAddress: term }
                ]
            });
        }
    });
}


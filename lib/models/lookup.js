// Copyright 2015, EMC, Inc.

'use strict';

module.exports = LookupModelFactory;

LookupModelFactory.$provide = 'Models.Lookup';
LookupModelFactory.$inject = [
    'Model',
    'Assert',
    'Errors',
    'Promise',
    'Constants'
];

function LookupModelFactory (Model, assert, Errors, Promise, Constants) {
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
                regex: Constants.Regex.IpAddress
            },
            macAddress: {
                type: 'string',
                unique: true,
                required: true,
                regex: Constants.Regex.MacAddress
            }
        },
        findByTerm: function (term) {
            var query = {}; //empty query will find all entries
            if (term) {
                query = {
                    or: [
                        { node: term },
                        { macAddress: term },
                        { ipAddress: term }
                    ]
                };
            }
            return this.find(query);
        },
        findOneByTerm: function (term) {
            return this.findByTerm(term).then(function (records) {
                if (records && records.length > 0) {
                    return records[0];
                } else {
                    throw new Errors.NotFoundError('Lookup Record Not Found (findOneByTerm)');
                }
            });
        },
        upsertNodeToMacAddress: function (node, macAddress) {
            assert.string(node, 'node');
            assert.string(macAddress, 'macAddress');

            var self = this;

            return self.findOne({ macAddress: macAddress }).then(function (record) {
                if (record) {
                    return self.update({ id: record.id }, { node: node }).then(function (records) {
                        return records[0];
                    });
                } else {
                    return self.create({ node: node, macAddress: macAddress });
                }
            });
        },
        setIp: function(ipAddress, macAddress) {
            var self = this;

            return Promise.all([
                self.findOne({ ipAddress: ipAddress }),
                self.findOne({ macAddress: macAddress })
            ]).spread(function(ipRecord, macRecord) {
                if (macRecord && macRecord.ipAddress === ipAddress) {
                    throw new Errors.BreakPromiseChainError();
                }
                return [ipRecord, macRecord];
            }).spread(function(ipRecord, macRecord) {
                if (!ipRecord) {
                    return [macRecord];
                }
                if (ipRecord.ipAddress === ipAddress && ipRecord.macAddress !== macAddress) {
                    return [
                        macRecord,
                        self.destroy({ id: ipRecord.id })
                            .then(function() {
                                delete ipRecord.ipAddress;
                                return self.create(ipRecord);
                            })
                    ];
                }
            }).spread(function(macRecord) {
                if (!macRecord) {
                    return self.create({ ipAddress: ipAddress, macAddress: macAddress });
                } else {
                    return self.update({ id: macRecord.id }, { ipAddress: ipAddress });
                }
            }).catch(Errors.BreakPromiseChainError, function() {
                return;
            });
        }
    });
}

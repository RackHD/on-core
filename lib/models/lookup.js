// Copyright 2015, EMC, Inc.

'use strict';

module.exports = LookupModelFactory;

LookupModelFactory.$provide = 'Models.Lookup';
LookupModelFactory.$inject = [
    'Services.Waterline',
    'Model',
    'Assert',
    'Errors',
    'Promise',
    'Constants'
];

function LookupModelFactory (waterline, Model, assert, Errors, Promise, Constants) {
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
            },
            proxy: {
                type: 'string'
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
        upsertProxyToMacAddress: function (proxy, macAddress) {
            assert.string(proxy, 'proxy');
            assert.string(macAddress, 'macAddress');

            var self = this;

            return self.findOne({ macAddress: macAddress }).then(function (record) {
                if (record) {
                    return self.update(
                        { id: record.id }, 
                        { proxy: proxy }
                    ).then(function (records) {
                        return records[0];
                    });
                } else {
                    throw new Errors.NotFoundError(
                        'Lookup Record Not Found (upsertProxyToMacAddress)'
                    );
                }
            });
        },
        setIp: function(ipAddress, macAddress) {
            var query = {
                ipAddress: ipAddress,
                macAddress: { $ne: macAddress } // old mac
            };

            var update = {
                $unset: {
                    ipAddress: ""
                }
            };

            var options = { new: true };

            //Queries for the ipAddress that are not matched with the macAddress
            //changes ip to null if macAddress doesn't match
            return waterline.lookups.findAndModifyMongo(query, {}, update, options)
                .then(function () {
                    // update new document for new IP assignment, do this second
                    query = {
                        macAddress: macAddress // new mac
                    };

                    update = {
                        $set: {
                            ipAddress: ipAddress
                        },
                        $setOnInsert: {
                            macAddress: macAddress
                        }
                    };

                    options = {
                        upsert: true,
                        new: true
                    };

                    return waterline.lookups.findAndModifyMongo(query, {}, update, options);
                });
        },
        setIndexes: function() {
            var indexes = [
                {
                    macAddress: 1
                },
                {
                    macAddress: 1, ipAddress: 1
                }
            ];
            return waterline.lookups.createUniqueMongoIndexes(indexes);
        }
    });
}

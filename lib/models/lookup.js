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
    'Constants',
    'Services.Configuration',
    'validator',
    '_'
];

function LookupModelFactory (
    waterline,
    Model,
    assert,
    Errors,
    Promise,
    Constants,
    configuration,
    validator,
    _
) {
    var dbType = configuration.get('databaseType', 'mongo');
    return Model.extend({
        connection: dbType,
        identity: 'lookups',
        attributes: {
            node: {
                model: 'nodes'
            },
            ipAddress: {
                type: 'string',
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

        $indexes: [
            {
                keys: { node: 1}
            },
            {
                keys: { ipAddress: 1},
                options: { unique: false }
            },
            {
                keys: { macAddress: 1, ipAddress: 1 },
                options: { unique: true }
            }
        ],

        findByTerm: function (term) {
            var query = {}; //empty query will find all entries
            if(validator.isIP(term)) {
                query.ipAddress = term;
            } else if( validator.isMongoId(term)) {
                query.node = term;
            } else if(term) {
                query.macAddress = _.map(_.isArray(term) ? term : [ term ],
                    function(term) {
                        return term.toLowerCase();
                    });
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
            var self = this;
            assert.string(node, 'node');
            assert.string(macAddress, 'macAddress');

            macAddress = macAddress.toLowerCase();
            var query = { macAddress: macAddress };
            var options = {
                new: true,
                upsert: true
            };

            switch(dbType) {
                case 'mongo':
                    return self.findAndModifyMongo(
                        query,
                        {},
                        {
                            $set: {
                                node: waterline.lookups.mongo.objectId(node)
                            }
                        },
                        options
                    );
                case 'postgresql':
                    return self.postgresqlRunLockedQuery('' +
                        'WITH upsert AS (UPDATE lookups SET "node"= $1, "updatedAt" = $3 WHERE "macAddress" = $2 RETURNING *) ' + //jshint ignore: line
                        'INSERT INTO lookups ("macAddress", "node", "createdAt", "updatedAt") ' +
                        'SELECT  $2, $1, $4, $4 WHERE NOT EXISTS (SELECT * FROM upsert);',
                        [node, macAddress, new Date(), new Date()]);
            }
            return new Errors.InternalServerError('invalid dbtype');
        },

        upsertProxyToMacAddress: function (proxy, macAddress) {
            assert.string(proxy, 'proxy');
            assert.string(macAddress, 'macAddress');

            var self = this;

            macAddress = macAddress.toLowerCase();
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
            macAddress = macAddress.toLowerCase();
            switch(dbType) {
                case 'mongo':
                    return this.setIpMongo(ipAddress, macAddress);
                case 'postgresql':
                    return this.setIpPostgreSQL(ipAddress, macAddress);
            }
            return new Errors.InternalServerError('invalid dbtype');
        },

        setIpMongo: function(ipAddress, macAddress) {
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

        setIpPostgreSQL: function(ipAddress, macAddress) {
            var self = this;
            return self.runQuery('UPDATE lookups SET "ipAddress" = $1 WHERE "macAddress" = $2;', [null, macAddress]) //jshint ignore: line
            .then(function() {
                return self.postgresqlRunLockedQuery('' +
                    'WITH upsert AS (UPDATE lookups SET "ipAddress"= $1, "updatedAt"=$3 WHERE "macAddress"=$2 RETURNING *) ' + //jshint ignore: line
                    'INSERT INTO lookups ("macAddress", "ipAddress", "updatedAt", "createdAt" ) ' +
                    'SELECT  $2, $1, $4, $4 WHERE NOT EXISTS (SELECT * FROM upsert);',
                    [ipAddress, macAddress, new Date(), new Date() ]
                );
            });
        }
    });
}

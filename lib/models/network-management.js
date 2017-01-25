// Copyrighr 2016, EMC, Inc.

'use strict';

module.exports = NetworkManagementModelFactory;

NetworkManagementModelFactory.$provide = 'NetworkManagement';
NetworkManagementModelFactory.$inject = [
    'Logger',
    'Model',
    'Services.Waterline',
    '_',
    'Services.Encryption',
    'Constants',
    'Promise',
    'util',
    'Errors',
    'Protocol.Events',
    'Assert'
];

function NetworkManagementModelFactory (
    Logger,
    Model,
    waterline,
    _,
    encryption,
    Constants,
    Promise,
    util,
    Errors,
    eventsProtocol,
    assert
) {
    var logger = Logger.initialize(NetworkManagementModelFactory);
    var secretsPattern = _.reduce(Constants.Logging.Redactions, function(pattern, regex) {
        return pattern ? util.format('%s|(?:%s)', pattern, regex.source) :
                         util.format('(?:%s)', regex.source);
    }, '');
    var secretsRegex = new RegExp(secretsPattern, 'i');

    function _encryptSecrets(obj) {
        assert.object(obj);
        assert.object(obj.config);

        obj.config = _(obj.config).mapValues(function(value, key) {
            if (key.match(secretsRegex)) {
                return encryption.encrypt(value);
            }
            return value;
        }).value();

        return obj;
    }

    function _deleteSecrets(obj) {
        assert.object(obj);
        assert.object(obj.config);

        obj.config = _(obj.config).omit(function(value, key) {
            return key.match(secretsRegex);
        }).value();

        return obj;
    }

    function _revealSecrets(obj) {
        assert.object(obj);
        assert.object(obj.config);

        _.forEach(obj.config, function(value, key) {
            if (key.match(secretsRegex)) {
                obj.config[key] = encryption.decrypt(value);
            }
        });

        return obj;
    }

    return {
        attributes: {
            node: {
                model: 'nodes',
                required: true,
                unique: false
            },
            service: {
                type: 'string',
                required: true
            },
            config: {
                type: 'json',
                required: true
            },
            toJSON: function() {
                var obj = this.toObject();
                return _deleteSecrets(obj);
            }
        },

        $indexes: [
            {
                keys: { node: 1 }
            },
            {
                keys: { node: 1, service: 1 },
                options: { unique: true }
            }
        ],

        beforeCreate: function(attrs, next) {
            _encryptSecrets(attrs);
            next();
        },

        beforeUpdate: function(attrs, next) {
            if (attrs && attrs.config) {
                _encryptSecrets(attrs);
            }
            next();
        },

        findByNode: function(nodeId, service, reveal, query) {
            var self = this;

            query = query || {};
            return Promise.try(function() {
                _.merge(query, {service: service, node: nodeId} );
                return self.findOne(query);
            })
            .then(function(mgmt) {
                if (mgmt && reveal) {
                    return _revealSecrets(mgmt);
                }
                return mgmt;
            });
        },

        // This function 'upserts' a new NetworkManagement into the corresponding mgmt collection.
        // A few notes on this function's behavior:
        // 1. This is not an isolated transaction.
        // 2. There is a possibility that two clients could concurrently
        //    attempt to upsert an NetworkManagement with the same node or service.
        // 3. If note 2 occurs, mongo indexes will prevent the creation of
        //    duplicate NetworkManagement resources.  It is the responsibility of the
        //    caller to decide how to handle errors thrown as a result.
        // 4. There is a possibility that another client has updated an NetworkManagement
        //    between the atomic create or modify and find operations.  This
        //    will cause the function fulfillment value to be inconsistent
        //    with the provided NetworkManagement arguments but consistent with the document
        //    content at the time of the find query.
        upsertByNode: function(nodeId, mgmt, options) {
            var query;
            var oldNode;
            var self = this;

            return Promise.try(function() {
                query = {node: nodeId, service: mgmt.service};
                return self.find(query);
            })
            .then(function(mgmtSettings) {
                assert.ok(mgmtSettings.length === 0 || mgmtSettings.length === 1,
                    "mgmts should be unique for a given node and service."
                );
                return _.first(mgmtSettings);
            })
            .tap(function() {
                return waterline.nodes.getNodeById(nodeId)
                .then(function(node) {
                    if(node) {
                        oldNode = node;
                    }
                });
            })
            .then(function(mgmtSetting){
                if(mgmtSetting){
                    assert.equal(mgmtSetting.node, nodeId,
                        "mgmtSetting does not match expected nodeId."
                    );
                    assert.equal(mgmtSetting.service, mgmt.service,
                        "mgmtSetting does not match expected service."
                    );

                    mgmtSetting.config = mgmt.config;
                    return self.updateOne(query, mgmt);
                } else {
                    mgmt.node = nodeId;
                    return self.create(mgmt);
                }
            })
            .then(function(mgmt) {
                if (options && options.revealSecrets) {
                    return _revealSecrets(mgmt);
                }
                return mgmt;
            })
            .tap(function() {
                if (oldNode) {
                    /* asynchronous, don't wait promise return for performance*/
                    waterline.nodes.getNodeById(oldNode.id)
                    .then(function (newNode) {
                        return eventsProtocol.publishNodeAttrEvent(oldNode, newNode, self.identity );
                    })
                    .catch(function (error) {
                        logger.error('Error occurs', error);
                    });
                }
            });
        },

        findAllByNode: function(nodeId, reveal, query) {
            var self = this;

            query = query || {};
            return Promise.try(function() {
                    _.merge(query, {node: nodeId} );
                    return self.find(query);
                })
                .then(function(mgmts) {
                    if (mgmts && reveal) {
                        return mgmts.map(_revealSecrets);
                    }
                    return mgmts;
                });
        },

        secret: function(attr) {
            return attr.match(secretsPattern);
        }
    };
}

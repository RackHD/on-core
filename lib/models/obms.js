// Copyrighr 2016, EMC, Inc.

'use strict';

module.exports = ObmsModelFactory;

ObmsModelFactory.$provide = 'Models.Obms';
ObmsModelFactory.$inject = [
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

function ObmsModelFactory (
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
    var logger = Logger.initialize(ObmsModelFactory);
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

    return Model.extend({
        connection: 'mongo',
        identity: 'obms',
        attributes: {
            node: {
                model: 'nodes',
                required: true
            },
            service: {
                type: 'string',
                required: true
            },
            config: {
                type: 'json',
                required: true,
            },
            toJSON: function() {
                var obj = this.toObject();
                return _deleteSecrets(obj);
            }
        },

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

        setIndexes: function() {
            var indexes = [
                {
                    node: 1, service: 1
                }
            ];
            return waterline.obms.createUniqueMongoIndexes(indexes);
        },

        findByNode: function(nodeId, service, reveal, query) {
            var self = this;

            query = query || {};
            return Promise.try(function() {
                _.merge(query, {service: service, node: nodeId} );
                return self.findOne(query);
            })
            .then(function(obm) {
                if (obm && reveal) {
                    return _revealSecrets(obm);
                }
                return obm;
            });
        },

        // This function 'upserts' a new OBM into the obms collection.
        // A few notes on this function's behavior:
        // 1. This is not an isolated transaction.
        // 2. There is a possibility that two clients could concurrently
        //    attempt to upsert an OBM with the same node or service.
        // 3. If note 2 occurs, mongo indexes will prevent the creation of
        //    duplicate OBM resources.  It is the responsibility of the
        //    caller to decide how to handle errors thrown as a result.
        // 4. There is a possibility that another client has updated an OBM
        //    between the atomic create or modify and find operations.  This
        //    will cause the function fulfillment value to be inconsistent
        //    with the provided obm arguments but consistent with the document
        //    content at the time of the find query.
        upsertByNode: function(nodeId, obm) {
            var query;
            var oldNode;
            var self = this;

            return Promise.try(function() {
                query = {node: nodeId, service: obm.service};
                return self.find(query);
            })
            .then(function(obmSettings) {
                assert.ok(obmSettings.length === 0 || obmSettings.length === 1,
                    "obms should be unique for a given node and service."
                );
                return _.first(obmSettings);
            })
            .tap(function() {
                return waterline.nodes.getNodeById(nodeId)
                .then(function(node) {
                    if(node) {
                        oldNode = node;
                    }
                });
            })
            .then(function(obmSetting) {
                if(obmSetting) {
                    assert.equal(obmSetting.node, nodeId,
                        "obmSetting does not match expected nodeId."
                    );
                    assert.equal(obmSetting.service, obm.service,
                        "obmSetting does not match expected service."
                    );

                    obmSetting.config = obm.config;
                    return self.updateOne(query, obm);
                } else {
                    obm.node = nodeId;
                    return self.create(obm);
                }
            })
            .tap(function() {
                if (oldNode) {
                    /* asynchronous, returned promise is ignored*/
                    waterline.nodes.getNodeById(oldNode.id)
                    .then(function (newNode) {
                        return eventsProtocol.publishNodeAttrEvent(oldNode, newNode, 'obms');
                    })
                    .then(function (error) {
                        logger.error('Error occur',error);
                    });
                }
            });
        },

        secret: function(attr) {
            return attr.match(secretsPattern);
        }
    });
}

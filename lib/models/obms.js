// Copyrighr 2016, EMC, Inc.

'use strict';

module.exports = ObmsModelFactory;

ObmsModelFactory.$provide = 'Models.Obms';
ObmsModelFactory.$inject = [
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

        publishEvent: function(nodeId, next) {
            return waterline.nodes.findByIdentifier(nodeId)
            .then(function(node) {
                if (!_.isEmpty(node)) {
                    return waterline.obms.find({node: node.id})
                    .then(function(obms) {
                        return eventsProtocol.publishNodeAlert(node.id,
                            { nodeId : node.id,
                              nodeType: node.type,
                              state: _.isEmpty(obms) ? 'identified': 'managed' });
                    });
                }
            }).then(function() {
                next();
            }).catch(function(err) {
                next(err);
            });
        },

        afterCreate: function (attrs, next) {
            this.publishEvent(attrs.node, next);
        },

        afterUpdate: function (attrs, next) {
            this.publishEvent(attrs.node, next);
        },

        afterDestroy: function (attrs, next) {
            this.publishEvent(attrs.node, next);
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
            });
        },

        secret: function(attr) {
            return attr.match(secretsPattern);
        }
    });
}

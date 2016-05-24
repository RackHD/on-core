// Copyright 2015, EMC, Inc.

'use strict';

module.exports = NodeModelFactory;

NodeModelFactory.$provide = 'Models.Node';
NodeModelFactory.$inject = [
    'Model',
    'Services.Waterline',
    '_',
    'Promise',
    'Constants',
    'Protocol.Waterline'
];

function NodeModelFactory (Model, waterline, _, Promise, Constants, waterlineProtocol) {
    return Model.extend({
        connection: 'mongo',
        identity: 'nodes',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            obmSettings: {
                type: 'json',
                required: false,
                json: true
            },
            type: {
                type: 'string',
                enum: _.values(Constants.NodeTypes),
                defaultsTo: 'compute'
            },
            workflows: {
                collection: 'graphobjects',
                via: 'node'
            },
            catalogs: {
                collection: 'catalogs',
                via: 'node'
            },
            sku: {
                model: 'skus'
            },
            snmpSettings: {
                type: 'json',
                json: true,
                required: false
            },
            bootSettings: {
                type: 'json',
                json: true,
                required: false
            },
            sshSettings: {
                type: 'json',
                json: true,
                required: false
            },
            autoDiscover: {
                type: 'boolean',
                defaultsTo: false
            },
            relations: {
                type: 'array',
                defaultsTo: []
            },
            tags: {
                type: 'array',
                defaultsTo: []
            },
            // We only count a node as having been discovered if
            // a node document exists AND it has any catalogs
            // associated with it
            discovered: function() {
                var self = this;
                return waterline.catalogs.findOne({"node": self.id})
                .then(function(catalog) {
                    return !_.isEmpty(catalog);
                });
            }
        },
        addTags: function(id, tags) {
            var self = this;
            var query = { _id: waterline.nodes.mongo.objectId(id) };
            var update = {
                            $addToSet: { tags: { $each: tags } },
                            $set: { updatedAt: new Date() }
                        };
            var options = { new: true };
            return self.findAndModifyMongo(query, {}, update, options)
            .then(function(record) {
                record.id = record._id;
                waterlineProtocol.publishRecord(self, 'updated', record);
                waterlineProtocol.publishRecord(self, 'tag-added', record);
                return record;
            });
        },
        remTags: function(id, tag) {
            var self = this;
            var query = { _id: waterline.nodes.mongo.objectId(id) };
            var update = {
                            $pull: { tags: tag },
                            $set: { updatedAt: new Date() }
                        };
            var options = { new: true };
            return self.findAndModifyMongo(query, {}, update, options)
            .then(function(record) {
                record.id = record._id;
                waterlineProtocol.publishRecord(self, 'updated', record);
                waterlineProtocol.publishRecord(self, 'tag-removed', record);
                return record;
            });
        },
        findByTag: function(tag) {
            return waterline.nodes.find({tags: tag});
        }
    });
}

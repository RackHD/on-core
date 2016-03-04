// Copyright 2015, EMC, Inc.

'use strict';

module.exports = NodeModelFactory;

NodeModelFactory.$provide = 'Models.Node';
NodeModelFactory.$inject = [
    'Model',
    'Services.Waterline',
    '_',
    'Promise',
    'Constants'
];

function NodeModelFactory (Model, waterline, _, Promise, Constants) {
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
            // TODO: Refactor to native mongo command once it is merged
            return Promise.fromNode(this.native.bind(this))
                .then(function(collection) {
                    return collection.update(
                        { _id: waterline.nodes.mongo.objectId(id) },
                        { 
                            $addToSet: { tags: { $each: tags } },
                            $set: { updatedAt: new Date() }
                        });
                });
        },
        remTags: function(id, tag) {
            // TODO: Refactor to native mongo command once it is merged
            return Promise.fromNode(this.native.bind(this))
                .then(function(collection) {
                    return collection.update(
                        { _id: waterline.nodes.mongo.objectId(id) },
                        { 
                            $pull: { tags: tag },
                            $set: { updatedAt: new Date() }
                        });
                });
        },
        findByTag: function(tag) {
            return waterline.nodes.find({tags: tag});
        }
    });
}

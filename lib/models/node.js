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
    'Services.Configuration',
    'Protocol.Waterline'
];

var bson = require('bson');
function NodeModelFactory (Model, waterline, _, Promise, Constants, configuration, waterlineProtocol) {
    var dbType = configuration.get('databaseType', 'mongo');

    var attributes = {
        identifiers: {
            type: 'array',
            required: false,
            index: true
        },
        name: {
            type: 'string',
            required: true
        },
            obms: {
                collection: 'obms',
                via: 'node'
        },
        type: {
            type: 'string',
            enum: _.values(Constants.NodeTypes),
            defaultsTo: 'compute',
            index: true
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
    };

    if( dbType !== 'mongo' )  {
        // For mongo compatibility we have to add the 
        // BSON id column to non-mongo DBs
        attributes.id = {
            type: 'string',
            primaryKey: true
        };
    }

    return Model.extend({
        connection: dbType,
        identity: 'nodes',
        attributes: attributes,
        addTags: function(id, tags) {
            var self = this;
            var dbType = _.first(self.connection);
            switch(dbType) {
            case 'mongo':
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
            case 'postgresql':
                // sails-postgres stores 'array' types as 'text' containing JSON.  We must
                // unfurl the JSON, merge with the request tag array, ensure uniqueness of entries,
                // then JSONify the result set and update the tags entries with it.
                return self.postgresqlRunLockedQuery('' +
                    'WITH t as (select array_agg(elem::text) from nodes, json_array_elements(nodes.tags::json) elem where id = $2), ' +
                    's as (select distinct unnest(array_cat(t.array_agg, ARRAY[$1])) from t) ' +
                    'UPDATE nodes SET tags = concat( \'[\', (select string_agg(unnest,\',\') from s), \']\'),"updatedAt"=$3 WHERE id = $2',
                    [ '"' + tags.join('","') + '"', id, new Date()])
                .then(function() {
                    return self.find({id: id})
                    .then(function(record) {
                        record.id = record._id;
                        waterlineProtocol.publishRecord(self, 'updated', record);
                        waterlineProtocol.publishRecord(self, 'tag-added', record);
                        return record;
                    });
                });
            }
        },

        remTags: function(id, tag) {
            var self = this;
            var dbType = _.first(self.connection);
            switch(dbType) {
            case 'mongo':
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
            case 'postgresql':
                // sails-postgres stores 'array' types as 'text' containing JSON.  We must
                // unfurl the JSON, remove the entry from the array, ensure uniqueness of entries,
                // then JSONify the result set and update the tags entries with it.
                return self.postgresqlRunLockedQuery('' +
                    'WITH t as (select array_agg(elem::text) from nodes, json_array_elements(nodes.tags::json) elem where id = $2), ' +
                    's as (select distinct unnest(array_remove(t.array_agg, $1)) from t) ' +
                    'UPDATE nodes SET tags = concat( \'[\', (select string_agg(unnest,\',\') from s), \']\'),"updatedAt"=$3 WHERE id = $2',
                    [ JSON.stringify(tag), id, new Date()])
                .then(function() {
                    return self.findOne({id: id})
                    .then(function(record) {
                        record.id = record._id;
                        waterlineProtocol.publishRecord(self, 'updated', record);
                        waterlineProtocol.publishRecord(self, 'tag-removed', record);
                        return record;
                    });
                });
            }
        },
        findByTag: function(tag) {
            return waterline.nodes.find({tags: tag});
        },
        beforeCreate: function dbCompatibility(obj, next) {
            var dbType = _.first(this.connection);
            if(dbType !== 'mongo') {
                var objId = new bson.ObjectID();
                obj.id = obj.id || objId.toString();
                obj.obmSettings = obj.obmSettings || [];
                obj.bootSettings = obj.bootSettings || {};
                obj.snmpSettings = obj.snmpSettings || {};
                obj.sshSettings = obj.sshSettings || {};
                return next();
            }
            return next();
        }
    });
}

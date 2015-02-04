// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = GraphModelFactory;

di.annotate(GraphModelFactory, new di.Provide('Models.GraphObject'));
di.annotate(GraphModelFactory, new di.Inject(
        'Model'
    )
);

function GraphModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'graphobjects',
        attributes: {
            instanceId: {
                type: 'string',
                required: true,
                uuidv4: true
            },
            context: {
                type: 'json',
                required: true,
                json: true
            },
            definition: {
                type: 'json',
                required: true,
                json: true
            },
            tasks: {
                type: 'json',
                required: true,
                json: true
            },
            nodes: {
                collection: 'nodes',
                via: 'workflows'
            },
            deserialize: function() {
                // Remove waterline keys that we don't want in our graph objects
                var obj = this.toObject();
                delete obj.createdAt;
                delete obj.updatedAt;
                delete obj.id;
                return obj;
            }
        }
    });
}

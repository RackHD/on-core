// Copyright 2015, EMC, Inc.

'use strict';

module.exports = RenderableModelFactory;

RenderableModelFactory.$provide = 'Renderable';
RenderableModelFactory.$inject = ['uuid'];

function RenderableModelFactory (uuid) {
    return {
        connection: 'mongo',
        attributes: {
            id: {
                type: 'string',
                uuidv4: true,
                primaryKey: true,
                unique: true,
                required: true,
                defaultsTo: function() { return uuid.v4(); }
            },
            name: {
                type: 'string',
                required: true,
                index: true
            },
            hash: {
                type: 'string',
                required: true
            },
            path: {
                type: 'string',
                required: true
            },
            scope: {
                type: 'string',
                defaultsTo: 'global'
            }
        }
    };
}

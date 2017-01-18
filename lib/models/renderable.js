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
                unique: false //allow same file name but in different scope
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
        },

        $indexes: [
            {
                keys: { name: 1, scope: 1 },
                options: { unique: true }
            }
        ],
    };
}

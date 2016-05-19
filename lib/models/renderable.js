// Copyright 2015, EMC, Inc.

'use strict';

module.exports = RenderableModelFactory;

RenderableModelFactory.$provide = 'Renderable';
RenderableModelFactory.$inject = [];

function RenderableModelFactory () {
    return {
        connection: 'mongo',
        attributes: {
            name: {
                type: 'string',
                required: true,
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

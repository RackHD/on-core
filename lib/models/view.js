// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ViewModelFactory;

ViewModelFactory.$provide = 'Models.View';
ViewModelFactory.$inject = [
    'Model'
];

function ViewModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'views',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            contents: {
                type: 'string',
                required: true
            },
            scope: {
                type: 'string',
                defaultsTo: 'global'
            }
        }
    });
}

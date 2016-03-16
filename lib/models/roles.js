// Copyright 2016, EMC, Inc.

'use strict';

module.exports = RolesModelFactory;

RolesModelFactory.$provide = 'Models.Roles';
RolesModelFactory.$inject = [
    'Model'
];

function RolesModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'roles',
        attributes: {
            role: {
                type: 'string',
                required: true
            },
            privileges: {
                type: 'array',
                defaultsTo: []
            }
        }
    });
}

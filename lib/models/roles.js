// Copyright 2016, EMC, Inc.

'use strict';

module.exports = RolesModelFactory;

RolesModelFactory.$provide = 'Models.Roles';
RolesModelFactory.$inject = [
    'Model',
    'Services.Configuration'
];

function RolesModelFactory (Model, configuration) {
    return Model.extend({
        connection: configuration.get('databaseType', 'mongo'),
        identity: 'roles',
        attributes: {
            role: {
                type: 'string',
                required: true,
                primaryKey: true
            },
            privileges: {
                type: 'array',
                defaultsTo: []
            }
        }
    });
}

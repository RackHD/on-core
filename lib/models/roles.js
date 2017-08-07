// Copyright 2016, EMC, Inc.

'use strict';

module.exports = RolesModelFactory;

RolesModelFactory.$provide = 'Models.Roles';
RolesModelFactory.$inject = [
    'Services.Waterline',
    'Model',
    'Services.Configuration'
];

function RolesModelFactory (waterline, Model, configuration) {
    var dbType = configuration.get('databaseType', 'mongo');
    return Model.extend({
        connection: dbType,
        identity: 'roles',
        attributes: {
            role: {
                type: 'string',
                required: true,
                primaryKey: true,
                unique: true
            },
            privileges: {
                type: 'array',
                defaultsTo: []
            }
        }
    });
}

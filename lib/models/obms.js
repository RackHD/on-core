// Copyright 2016, EMC, Inc.

'use strict';

module.exports = ObmsModelFactory;

ObmsModelFactory.$provide = 'Models.Obms';
ObmsModelFactory.$inject = [
    'Model',
    'NetworkManagement',
    '_',
    'Services.Configuration'
];

function ObmsModelFactory (Model, NetworkManagement, _, configuration) {
    var obmModel = _.merge(
        {},
        NetworkManagement,
        {identity: 'obms', connection: configuration.get('databaseType', 'mongo') }
    );
    return Model.extend(obmModel);
}

// Copyright 2016, EMC, Inc.

'use strict';

module.exports = InBandMgmtModelFactory;

InBandMgmtModelFactory.$provide = 'Models.InBandMgmt';
InBandMgmtModelFactory.$inject = [
    'Model',
    'NetworkManagement',
    '_',
    'Services.Configuration'
];

function InBandMgmtModelFactory (Model, NetworkManagement, _, configuration) {
    var InBandMgmtModel = _.merge(
        {},
        NetworkManagement,
        {identity: 'ibms', connection: configuration.get('databaseType', 'mongo') }
    );
    return Model.extend(InBandMgmtModel);
}

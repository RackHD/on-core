// Copyright 2016, EMC, Inc.

'use strict';

module.exports = FirmwareModelFactory;

FirmwareModelFactory.$provide = 'Models.Firmware';
FirmwareModelFactory.$inject = [
    'Model',
    'NetworkManagement',
    '_',
    'Services.Configuration'
];

function FirmwareModelFactory (Model, NetworkManagement, _, configuration) {
    var firmwareModel = _.merge(
        {},
        {identity: 'firmware', connection: configuration.get('databaseType', 'mongo') }
    );
    return Model.extend(firmwareModel);
}

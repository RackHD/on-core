// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ProfileModelFactory;

ProfileModelFactory.$provide = 'Models.Profile';
ProfileModelFactory.$inject = [
    'Model',
    'Renderable',
    '_',
    'Services.Configuration'
];

function ProfileModelFactory (Model, Renderable, _, configuration) {
    var profileModel = _.merge(
        {},
        Renderable,
        {identity: 'profiles', connection: configuration.get('databaseType', 'mongo') }
    );
    return Model.extend(profileModel);
}

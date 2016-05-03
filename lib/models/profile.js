// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ProfileModelFactory;

ProfileModelFactory.$provide = 'Models.Profile';
ProfileModelFactory.$inject = [
    'Model',
    'Renderable',
    '_'
];

function ProfileModelFactory (Model, Renderable, _) {
    var profileModel = _.merge(
        {},
        Renderable,
        {identity: 'profiles'}
    );
    return Model.extend(profileModel);
}

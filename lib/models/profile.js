// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ProfileModelFactory;

ProfileModelFactory.$provide = 'Models.Profile';
ProfileModelFactory.$inject = [
    'Model'
];

function ProfileModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'profiles',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            contents: {
                type: 'string',
                required: true
            }
        }
    });
}

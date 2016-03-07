// Copyright 2016, EMC, Inc.

'use strict';

module.exports = LocalUserModelFactory;

LocalUserModelFactory.$provide = 'Models.LocalUser';
LocalUserModelFactory.$inject = [
    'Model'
];

var bcrypt = require('bcrypt');
function LocalUserModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'localusers',
        attributes: {
            username: {
                type: 'string',
                required: true
            },
            password:{
                type: 'string',
                required: true,
                minLength: 6,
                maxLength: 50
            },
            role: {
                type: 'string',
                defaultsTo: 'ReadOnly'  // change to Constants
            },
            comparePassword: function (password) {
              return bcrypt.compareSync(password, this.password);
            }
        },
        beforeCreate: serialize,
        beforeUpdate: serialize
    });

    function serialize(obj, next) {
        var SALT_FACTOR = 10;
        bcrypt.hash(obj.password, SALT_FACTOR, function(err, passphrase) {
            if(err) {
                return next(err);
            }
            obj.password = passphrase;
            return next();
        });
    }
}

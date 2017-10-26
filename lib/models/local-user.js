// Copyright 2016, EMC, Inc.

'use strict';

module.exports = LocalUserModelFactory;

LocalUserModelFactory.$provide = 'Models.LocalUser';
LocalUserModelFactory.$inject = [
    'Model',
    'Services.Configuration'
];

var crypto = require('crypto');

var hashConfig = {
    // number of bytes in the Hash
    hashBytes: 64,
    // number of bytes in the salt
    saltBytes: 64,
    // number of iterations to get the final hash, longer means more secure,
    // but also slower
    iterations: 10000
};


function LocalUserModelFactory (Model, configuration) {
    return Model.extend({
        connection: configuration.get('databaseType', 'mongo'),
        identity: 'localusers',
        attributes: {
            username: {
                type: 'string',
                required: true,
                primaryKey: true
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
                var combined = new Buffer(this.password, 'base64');
                var saltBytes = hashConfig.saltBytes;
                var hashBytes = combined.length - hashConfig.saltBytes;
                var iterations = hashConfig.iterations;
                var salt = combined.slice(0, saltBytes);
                var hash = combined.toString('binary', saltBytes);
                var verify = crypto.pbkdf2Sync(password, salt, iterations, hashBytes, 'sha512');
                return verify.toString('binary') === hash;
            }
        },
        beforeCreate: serialize,
        beforeUpdate: serialize
    });

    function serialize(obj, next) {
        crypto.randomBytes(hashConfig.saltBytes, function(err, salt) {
            if (err) {
                return next(err);
            }
            crypto.pbkdf2(obj.password, salt, hashConfig.iterations, hashConfig.hashBytes, "sha512", function(err, hash) { //jshint ignore: line
                if (err) {
                    return next(err);
                }

                var combined = new Buffer(hash.length + salt.length);
                salt.copy(combined);
                hash.copy(combined, salt.length);
                obj.password = combined.toString('base64');
                next();
            });
        });
    }
}

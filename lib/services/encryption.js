// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = encryptionServiceFactory;

di.annotate(encryptionServiceFactory, new di.Provide('Services.Encryption'));
di.annotate(encryptionServiceFactory,
    new di.Inject(
        'Promise',
        'Services.Configuration',
        'Encryption'
    )
);

function encryptionServiceFactory(Promise, configuration, Encryption) {
    var shared = 'qxfO2D3tIJsZACu7UA6Fbw0avowo8r79ALzn+WeuC8M=';

    function EncryptionService () {
        this.encryption = new Encryption ();
    }

    EncryptionService.prototype.encrypt = function (data, iv) {
        return this.encryption.encrypt(
            data,
            configuration.get(
                'sharedKey',
                shared
            ),
            iv
        );
    };

    EncryptionService.prototype.decrypt = function (data) {
        return this.encryption.decrypt(
            data,
            configuration.get(
                'sharedKey',
                shared
            )
        );
    };

    EncryptionService.prototype.start = function start() {
        return Promise.resolve();
    };

    EncryptionService.prototype.stop = function stop() {
        return Promise.resolve();
    };

    return new EncryptionService();
}

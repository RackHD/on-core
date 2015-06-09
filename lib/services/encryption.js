// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = encryptionServiceFactory;

encryptionServiceFactory.$provide = 'Services.Encryption';
encryptionServiceFactory.$inject = [
    'Promise',
    'Services.Configuration',
    'Encryption'
];

function encryptionServiceFactory(Promise, configuration, Encryption) {
    var shared = 'qxfO2D3tIJsZACu7UA6Fbw0avowo8r79ALzn+WeuC8M=';

    function EncryptionService () {
        this.encryption = new Encryption ();
    }

    EncryptionService.prototype.encrypt = function (data, iv) {
        if (this.encryption.isEncrypted(data)) {
            return data;
        } else {
            return this.encryption.encrypt(
                data,
                this.key,
                iv
            );
        }
    };

    EncryptionService.prototype.decrypt = function (data) {
        if (this.encryption.isEncrypted(data)) {
            return this.encryption.decrypt(
                data,
                this.key
            );
        } else {
            return data;
        }
    };

    EncryptionService.prototype.start = function start() {
        this.key = configuration.get('sharedKey', shared);

        return Promise.resolve();
    };

    EncryptionService.prototype.stop = function stop() {
        return Promise.resolve();
    };

    return new EncryptionService();
}

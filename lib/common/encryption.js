// Copyright 2015, EMC, Inc.

'use strict';

module.exports = encryptionFactory;

encryptionFactory.$provide = 'Encryption';
encryptionFactory.$inject = [
    'crypto',
    'Constants',
    'crypt3'
];

function encryptionFactory(
    crypto,
    Constants,
    crypt3
) {
    function Encryption () {
    }

    Encryption.prototype.key = function () {
        return crypto.randomBytes(32).toString('base64');
    };

    Encryption.prototype.iv = function () {
        return crypto.randomBytes(16).toString('base64');
    };

    Encryption.prototype.encrypt = function (data, key, iv) {
        iv = iv || this.iv();

        var cipher = crypto.createCipheriv(
            'aes-256-cbc',
            new Buffer(key, 'base64'),
            new Buffer(iv, 'base64')
        );

        var encrypted = Buffer.concat([
            cipher.update(data),
            cipher.final()
        ]);

        return '%s.%s'.format(
            iv.toString('base64'),
            encrypted.toString('base64')
        );
    };

    Encryption.prototype.decrypt = function (data, key) {
        var parts = data.split('.');

        var cipher = crypto.createDecipheriv(
            'aes-256-cbc',
            new Buffer(key, 'base64'),
            new Buffer(parts[0], 'base64')
        );

        var decrypted = Buffer.concat([
            cipher.update(new Buffer(parts[1], 'base64')),
            cipher.final()
        ]);

        return decrypted.toString();
    };

    Encryption.prototype.isEncrypted = function (data) {
        return Constants.Regex.Encrypted.test(data);
    };

    /**
     * Calculate the hash for input data
     * @param {String} data - The input data
     * @param {String} [algorithm='sha512'] - The hash algorithm, it should be one of
     * ['sha512', 'sha256','md5'], the default is 'sha512'
     * @param {String} [salt] - The salt feed to hash algorithm, if not specified, the function will
     * generate a random salt.
     * @return {String} the hashed data
     */
    Encryption.prototype.createHash = function (data, algorithm, salt) {
        algorithm = algorithm || 'sha512';
        salt = salt || crypt3.createSalt(algorithm);
        return crypt3(data, salt);
    };

    return Encryption;
}

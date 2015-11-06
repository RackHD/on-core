// Copyright 2015, EMC, Inc.

'use strict';

module.exports = encryptionFactory;

encryptionFactory.$provide = 'Encryption';
encryptionFactory.$inject = [
    'crypto',
    'Constants',
    'apache-crypt'
];

function encryptionFactory(
    crypto,
    Constants,
    crypt
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
        return crypt(data, this.createSalt(algorithm, salt));
    };

    /**
     * Create a salt to be used with crypt()
     * @param {String} [algorithm='sha512'] - The hash algorithm, it should be one of
     * ['sha512', 'sha256','md5'], the default is 'sha512'
     * @param {String} [salt] - The salt feed to hash algorithm, if not specified, the function will
     * generate a random salt.
     * @return {String} the salt
     */
    Encryption.prototype.createSalt = function (algorithm, salt) {
        algorithm = algorithm || 'sha512';
        var signitures = {
          md5: '$1$',
          sha256: '$5$',
          sha512: '$6$'
        };
        if(!signitures[algorithm]) {
          throw new TypeError('Unknown salt algorithm: ' + algorithm);
        }
        if (salt && salt.charAt(0) === '$') salt = salt.split('$')[2];
        return signitures[algorithm] +
          (salt || crypto.randomBytes(10).toString('base64'));
    };

    return Encryption;
}

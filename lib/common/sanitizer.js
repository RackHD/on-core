// Copyright 2015, EMC, Inc.

'use strict';

module.exports = SanitizerFactory;

SanitizerFactory.$provide = 'Sanitizer';
SanitizerFactory.$inject = [
    'Services.Encryption',
    'Constants',
    'Util',
    '_'
];

function SanitizerFactory (
    encryption,
    Constants,
    util,
    _
) {

    var secretsPattern = _.reduce(Constants.Logging.Redactions, function(pattern, regex) {
        return pattern ? util.format('%s|(?:%s)', pattern, regex.source) :
                         util.format('(?:%s)', regex.source);
    }, '');
    var secretsRegex = new RegExp(secretsPattern, 'i');

    function sanitizer (obj) {
        _.forOwn(obj, function(value, key) {
            if (typeof(value) === 'object') {
                sanitizer(value);
            } else if ( key.match( secretsRegex )) {
                obj[key] = encryption.encrypt(value);
            }
        });
    }

    function de_sanitizer (obj) {
        _.forOwn(obj, function(value, key) {
            if (typeof(value) === 'object') {
                de_sanitizer(value);
            } else if ( key.match( secretsRegex )) {
                obj[key] = encryption.decrypt(value);
            }
        });
    }

    return {
        encrypt: sanitizer,
        decrypt: de_sanitizer
    }
}

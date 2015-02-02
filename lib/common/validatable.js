// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = ValidatableFactory;

di.annotate(ValidatableFactory, new di.Provide('Validatable'));
di.annotate(ValidatableFactory,
    new di.Inject(
        'Q',
        '_',
        'anchor',
        'validator',
        'Errors'
    )
);

function ValidatableFactory (Q, _, anchor, validator, Errors) {
    // NPM installed version of validator uses isIP vs isIPv4 as in previous versions.
    anchor.define('ipv4', function (ip) {
        return validator.isIP(ip, 4);
    });

    // NPM installed version of validator uses isIP vs isIPv6 as in previous versions.
    anchor.define('ipv6', function (ip) {
        return validator.isIP(ip, 6);
    });

    anchor.define('macaddress', function(mac) {
        var macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        return macRegex.test(mac);
    });

    function Validatable(rules) {
        Object.defineProperty(this, 'rules', {
            value: rules || {},
            enumerable: false
        });
    }

    Validatable.prototype.validate = function (target) {
        var self = this;

        target = target || this;

        // Transform the rules since any properties not defined won't be iterated.
        var errors = _.transform(self.rules, function (accumulator, value, key) {
            if (value.required || target[key] !== undefined) {
                var outcome = anchor(target[key]).to(value);

                if (outcome) {
                    accumulator[key] = outcome;
                }
            }
        });

        // Return the object on success or the error object on failure.
        if (_.isEmpty(errors)) {
            return Q.resolve(self);
        } else {
            // TODO: convert errors into a sensible Error object.
            return Q.reject(new Errors.ValidationError(errors));
        }
    };

    return Validatable;
}

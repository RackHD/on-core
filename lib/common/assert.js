// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = AssertServiceFactory;

di.annotate(AssertServiceFactory, new di.Provide('Assert'));
di.annotate(AssertServiceFactory,
    new di.Inject(
        '_',
        'assert-plus',
        'validator'
    )
);

function AssertServiceFactory(_, assert, validator) {
    validator.extend('isMac', function(mac) {
        var macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        return macRegex.test(mac);
    });

    function AssertService () {
    }

    /**
     * https://github.com/mcavage/node-assert-plus
     *
     * All methods exposed on assert plus are available on the assert service.
     */
    _.each(_.methods(assert), function (method) {
        AssertService.prototype[method] = function () {
            assert[method].apply(assert, Array.prototype.slice.call(arguments));
        };
    });

    /**
     * https://github.com/chriso/validator.js
     *
     * All methods exposed on the validator are avaialble on the assert service.
     */
    _.each(_.methods(validator), function (method) {
        AssertService.prototype[method] = function () {
            var args = Array.prototype.slice.call(arguments) || [];

            this.ok(
                validator[method].apply(
                    validator,
                    args
                ),
                'Violated ' + method + ' constraint (' + args.join(',') + ').'
            );
        };
    });

    // TODO: add assert.isObject(object, [type=object.constructor.name])

    return new AssertService();
}

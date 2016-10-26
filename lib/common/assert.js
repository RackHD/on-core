// Copyright 2015, EMC, Inc.
// Adding a line

'use strict';

module.exports = AssertServiceFactory;

AssertServiceFactory.$provide = 'Assert';
AssertServiceFactory.$inject = [
    '_',
    'assert-plus',
    'validator',
    'Constants'
];

function AssertServiceFactory(_, assert, validator, Constants) {
    validator.extend('isMac', function(mac) {
        return Constants.Regex.MacAddress.test(mac);
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
            var args = Array.prototype.slice.call(arguments);

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

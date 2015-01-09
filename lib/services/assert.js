// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di'),
    _ = require('lodash'),
    assert = require('assert-plus');

module.exports = AssertServiceFactory;

di.annotate(AssertServiceFactory, new di.Provide('Services.Assert'));

di.annotate(AssertServiceFactory,
    new di.Inject(
        di.Injector
    )
);

function AssertServiceFactory(injector) {
    function AssertService () {
    }

    _.each(_.methods(assert), function (method) {
        AssertService.prototype[method] = function () {
            var configuration = injector.get('Services.Configuration');
            var setting = configuration.get('assert') || 'log';

            try {
                if (setting !== 'off') {
                    assert[method].apply(assert, Array.prototype.slice.call(arguments));
                }
            } catch (error) {
                console.error('assert.' + method + ' ' + error.stack);

                switch(setting) {
                    case 'throw':
                        throw error;

                    case 'exit':
                        process.nextTick(function() {
                            process.exit(-1);
                        });
                        break;

                    default:
                        // noop, we always log regardless of configuration.get('assert')
                        break;

                }
            }
        };
    });

    return new AssertService();
}

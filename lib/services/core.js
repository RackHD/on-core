// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = coreServiceFactory;

di.annotate(coreServiceFactory, new di.Provide('Services.Core'));

di.annotate(coreServiceFactory,
    new di.Inject(
        'Services.Waterline',
        'Services.Messenger',
        'Q',
        '_',
        di.Injector
    )
);

function coreServiceFactory(waterline, messenger, Q, _, injector) {
    function CoreService () {
    }

    CoreService.prototype.start = function start() {
        return waterline.start()
        .then(function() {
            return messenger.start();
        })
        .then(function() {
            var protocols = injector.getMatching('Protocol.*');
            return Q.all(_.map(protocols, function(protocol) {
                return protocol.start();
            }));
        });
    };

    CoreService.prototype.stop = function stop() {
        return waterline.stop()
        .then(function() {
            return messenger.stop();
        });
    };

    return new CoreService();
}

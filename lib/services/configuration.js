// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di'),
    fs = require('fs');

module.exports = nconfServiceFactory;

di.annotate(nconfServiceFactory, new di.Provide('Services.Configuration'));
di.annotate(nconfServiceFactory,
    new di.Inject(
        'nconf',
        'Protocol.Configuration',
        'Q'
    )
);

function nconfServiceFactory(nconf, configurationProtocol, Q) {
    function NconfService() {
        this.subscriptions = [];
        var defaults = process.cwd() + '/config.json',
            overrides = process.cwd() + '/overrides.json';

        nconf.use('memory');

        if (fs.existsSync(overrides)) {
            nconf.file('overrides', overrides);
        }

        nconf.argv()
            .env()
            .file('config', defaults);
    }

    NconfService.prototype.set = function set(key, value) {
        nconf.set(key, value);
    };

    NconfService.prototype.get = function get(key) {
        return nconf.get(key);
    };

    NconfService.prototype.start = function start() {
        var self = this;
        return configurationProtocol.start()
        .then(function() {
            return Q.all([
                configurationProtocol.subscribeSet(self.set),
                configurationProtocol.subscribeGet(self.get),
            ]);
        })
        .spread(function(s1, s2) {
            self.subscriptions.push(s1.queue);
            self.subscriptions.push(s2.queue);
        });
    };

    NconfService.prototype.stop = function stop() {
        // remove subscriptions here
        return;
    };

    return new NconfService();
}

// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di'),
    fs = require('fs');

module.exports = configurationServiceFactory;

di.annotate(configurationServiceFactory, new di.Provide('Services.Configuration'));
di.annotate(configurationServiceFactory,
    new di.Inject(
        'nconf',
        'Protocol.Configuration',
        'Q'
    )
);

function configurationServiceFactory(nconf, configurationProtocol, Q) {
    function ConfigurationService() {
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

    ConfigurationService.prototype.set = function set(key, value) {
        nconf.set(key, value);
    };

    ConfigurationService.prototype.get = function get(key) {
        return nconf.get(key);
    };

    ConfigurationService.prototype.start = function start() {
        var self = this;
        return Q.all([
            configurationProtocol.subscribeSet(self.set),
            configurationProtocol.subscribeGet(self.get)
        ])
        .spread(function(s1, s2) {
            self.subscriptions.push(s1);
            self.subscriptions.push(s2);
        });
    };

    ConfigurationService.prototype.stop = function stop() {
        this.subscriptions.forEach(function (subscription) {
            subscription.dispose();
        });

        return Q.resolve();
    };

    return new ConfigurationService();
}

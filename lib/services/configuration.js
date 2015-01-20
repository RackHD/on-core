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
        'Q',
        '_'
    )
);

function configurationServiceFactory(nconf, configurationProtocol, Q, _) {
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

        return this;
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

            self.set('baseDirectory', __dirname + '/../..');
        });
    };

    ConfigurationService.prototype.stop = function stop() {
        return Q.all(_.map(this.subscriptions, function(subscription) {
            return subscription.dispose();
        }));
    };

    return new ConfigurationService();
}

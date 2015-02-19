// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di'),
    fs = require('fs');

module.exports = configurationServiceFactory;

di.annotate(configurationServiceFactory, new di.Provide('Services.Configuration'));
di.annotate(configurationServiceFactory,
    new di.Inject(
        'Constants',
        'Assert',
        'nconf',
        'Protocol.Configuration',
        'Q',
        '_'
    )
);

function configurationServiceFactory(
    Constants,
    assert,
    nconf,
    configurationProtocol,
    Q,
    _
) {
    function ConfigurationService() {
        this.subscriptions = [];

        nconf.use('memory');

        if (fs.existsSync(Constants.Configuration.Files.Overrides)) {
            nconf.file('overrides', Constants.Configuration.Files.Overrides);
        }

        nconf.argv().env();

        if (fs.existsSync(Constants.Configuration.Files.Default)) {
            nconf.file('config', Constants.Configuration.Files.Default);
        }
    }

    ConfigurationService.prototype.set = function set(key, value) {
        assert.string(key, 'key');

        nconf.set(key, value);

        return this;
    };

    ConfigurationService.prototype.get = function get(key) {
        assert.string(key, 'key');

        return nconf.get(key);
    };

    ConfigurationService.prototype.getAll = function () {
        return nconf.get();
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
            if (subscription) {
                return subscription.dispose();
            }
        }));
    };

    return new ConfigurationService();
}

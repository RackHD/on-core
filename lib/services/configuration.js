// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = configurationServiceFactory;

di.annotate(configurationServiceFactory, new di.Provide('Services.Configuration'));
di.annotate(configurationServiceFactory,
    new di.Inject(
        'Constants',
        'Assert',
        'nconf',
        'Q',
        'fs',
        'path',
        'Logger'
    )
);

function configurationServiceFactory(
    Constants,
    assert,
    nconf,
    Q,
    fs,
    path,
    Logger
) {
    var logger = Logger.initialize(configurationServiceFactory);

    function ConfigurationService() {
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

    ConfigurationService.prototype.get = function get(key, defaults) {
        assert.string(key, 'key');

        var value = nconf.get(key);

        if (value === undefined) {
            logger.warning('Configuration Value Undefined, Using Default (%s => %s).'.format(
                key,
                defaults
            ));

            return defaults;
        }

        return value;
    };

    ConfigurationService.prototype.getAll = function () {
        return nconf.get();
    };

    ConfigurationService.prototype.start = function start() {
        this.set('baseDirectory', path.resolve(__dirname + '/../..'));

        return Q.resolve();
    };

    ConfigurationService.prototype.stop = function stop() {
        return Q.resolve();
    };

    return new ConfigurationService();
}

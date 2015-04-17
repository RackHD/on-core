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
        this.startupPriority = 0;

        nconf.use('memory');
    }

    ConfigurationService.prototype.set = function set(key, value) {
        assert.string(key, 'key');

        nconf.set(key, value);

        return this;
    };

    ConfigurationService.prototype.get = function get(key, defaults) {
        assert.string(key, 'key');
        assert.ok(this.started, 'Configuration Service Not Started');

        var value = nconf.get(key);

        if (value === undefined) {
            logger.info('Configuration Value Undefined, Using Default (%s => %s).'.format(
                key,
                defaults
            ));

            return defaults;
        }

        return value;
    };

    ConfigurationService.prototype.getAll = function () {
        assert.ok(this.started, 'Configuration Service Not Started');

        return nconf.get();
    };

    ConfigurationService.prototype.start = function start() {
        if (fs.existsSync(Constants.Configuration.Files.Overrides)) {
            nconf.file('overrides', Constants.Configuration.Files.Overrides);
        }

        nconf.argv().env();

        if (fs.existsSync(Constants.Configuration.Files.Default)) {
            nconf.file('config', Constants.Configuration.Files.Default);
        }

        var baseDirectory = path.resolve(__dirname + '/../..');

        this.set('baseDirectory', baseDirectory);

        logger.info('Setting Base Directory to %s.'.format(baseDirectory));

        this.started = true;

        return Q.resolve();
    };

    ConfigurationService.prototype.stop = function stop() {
        return Q.resolve();
    };

    return new ConfigurationService();
}


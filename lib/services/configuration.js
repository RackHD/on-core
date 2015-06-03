// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = configurationServiceFactory;

configurationServiceFactory.$provide = 'Services.Configuration';
configurationServiceFactory.$inject = [
    'Constants',
    'Assert',
    'nconf',
    'Promise',
    'fs',
    'path',
    'Logger'
];

function configurationServiceFactory(
    Constants,
    assert,
    nconf,
    Promise,
    fs,
    path,
    Logger
) {
    var logger = Logger.initialize(configurationServiceFactory);

    function ConfigurationService() {
        this.startupPriority = 0;
        this.load();
    }

    ConfigurationService.prototype.load = function() {
        nconf.use('memory');

        // TODO: Move the remaining code to start once deprecation warnings are fixed.
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
    };

    ConfigurationService.prototype.set = function set(key, value) {
        assert.string(key, 'key');

        nconf.set(key, value);

        return this;
    };

    ConfigurationService.prototype.get = function get(key, defaults) {
        assert.string(key, 'key');

        if (!this.started) {
            logger.deprecate(
                'Configuration Service Should Be Started Prior to Accessing Values', 3
            );
        }

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
        if (!this.started) {
            logger.deprecate(
                'Configuration Service Should Be Started Prior to Accessing Values', 3
            );
        }

        return nconf.get();
    };

    ConfigurationService.prototype.start = function start() {
        this.started = true;

        return Promise.resolve();
    };

    ConfigurationService.prototype.stop = function stop() {
        return Promise.resolve();
    };

    return new ConfigurationService();
}


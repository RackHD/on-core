// Copyright 2015, EMC, Inc.

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

        nconf.argv().env();

        if (fs.existsSync(Constants.Configuration.Files.Global)) {
            nconf.file('global', Constants.Configuration.Files.Global);
        }

        var baseDirectory = path.resolve(__dirname + '/../..');

        this.set('baseDirectory', baseDirectory);

        logger.info('Setting base directory for loading configuration to %s.'.format(
            baseDirectory));
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
                'Attempting to access %s - prior to configuration service being started'.format(
                    key), 3
            );
        }

        var value = nconf.get(key);

        if (value === undefined) {
            logger.info('Configuration value is undefined, using default (%s => %s).'.format(
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
                'Attempting to access configuration values prior to ' +
                'configuration service being started.', 3
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

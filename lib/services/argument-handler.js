// Copyright 2016, EMC, Inc.

'use strict';

module.exports = argumentHandlerServiceFactory;

argumentHandlerServiceFactory.$provide = 'Services.ArgumentHandler';
argumentHandlerServiceFactory.$inject = [
    'Promise',
    '_',
    'Services.Configuration',
    'LogEvent'
];

function argumentHandlerServiceFactory(
    Promise,
    _,
    config,
    LogEvent
){
    function ArgumentHandlerService() {}

    /**
     * Get the value from configuration by a collection of keys
     *
     * Sometimes we define different keys in configuration file and command line argument, because
     * configuration file prefers the full key name, but command line prefers the short and mnemonic
     * name. The argument handle can support the configuration from either file or command line, so
     * this function is a helper to enumerate all keys, any key exists in configuration will return
     * its value, if all keys don't exist, then return the default value.
     * The earlier key in the input keys collection will take precedence over latter.
     *
     * @param {Collection} keys - the collection of keys
     * @param {*} defaultValue - the default value that will be returned if all keys don't exist.
     * @returns {*} the value of those keys, if all keys don't exist, will return the defaultValue.
     */
    ArgumentHandlerService.prototype._getValue = function(keys, defaultValue) {
        var val;
        _.forEach(keys, function(key) {
            var v = config.get(key);
            if (v !== undefined) {
                val = v;
                return false;
            }
        });
        return (val === undefined ? defaultValue : val);
    };

    /**
     * Start the argument handler service.
     */
    ArgumentHandlerService.prototype.start = function() {
        var self = this;
        return Promise.try(function() {
            //Configure the log colorful output
            var colorEnable = self._getValue(['color', 'logColorEnable'], false);
            LogEvent.setColorEnable(colorEnable);
        });
    };

    ArgumentHandlerService.prototype.stop = function() {
        return Promise.resolve();
    };

    return new ArgumentHandlerService();
}

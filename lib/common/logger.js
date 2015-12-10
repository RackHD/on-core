// Copyright 2015, EMC, Inc.

'use strict';

module.exports = loggerFactory;

loggerFactory.$provide = 'Logger';
loggerFactory.$inject = [
    'Events',
    'Constants',
    'Assert',
    '_',
    'Util',
    'stack-trace',
    'nconf'
];

/**
 * loggerFactory returns a Logger instance.
 * @private
 */
function loggerFactory(
    events,
    Constants,
    assert,
    _,
    util,
    stack,
    nconf
) {
    var levels = _.keys(Constants.Logging.Levels);

    function getCaller (depth) {
        var current = stack.get()[depth];

        var file = current.getFileName().replace(
            Constants.WorkingDirectory,
            ''
        ) + ':' + current.getLineNumber();

        return file.replace(/^node_modules/, '');
    }

    function Logger (module) {
        var provides = util.provides(module);

        if (provides !== undefined) {
            this.module = provides;
        } else {
            if (_.isFunction(module)) {
                this.module = module.name;
            } else {
                this.module = module || 'No Module';
            }
        }
    }

    Logger.prototype.log = function (level, message, context) {
        assert.isIn(level, levels);
        assert.string(message, 'message');

        // Exit if the log level of this message is less than the minimum log level.
        var minLogLevel = nconf.get('minLogLevel');
        if ((minLogLevel === undefined) || (typeof minLogLevel !== 'number')) {
            minLogLevel = 0;
        }
        if (Constants.Logging.Levels[level] < minLogLevel) {
            return;
        }

        events.log({
            name: Constants.Name,
            host: Constants.Host,
            module: this.module,
            level: level,
            message: message,
            context: context,
            timestamp: new Date().toISOString(),
            caller: getCaller(3),
            subject: 'Server'
        });
    };

    _.forEach(levels, function(level) {
        Logger.prototype[level] = function (message, context) {
            this.log(level, message, context);
        };
    });

    Logger.prototype.deprecate = function (message, frames) {
        console.error([
            'DEPRECATION:',
            this.module,
            '-',
            message,
            getCaller(frames || 2)
        ].join(' '));
    };

    Logger.initialize = function (module) {
        return new Logger(module);
    };

    return Logger;
}

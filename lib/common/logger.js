// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di');
var os = require('os');

module.exports = loggerFactory;

di.annotate(loggerFactory, new di.Provide('Logger'));
di.annotate(loggerFactory,
    new di.Inject(
        'Constants',
        'Assert',
        'Protocol.Logging',
        'LogEvent',
        'Services.Waterline',
        'Services.Configuration',
        'Tracer',
        'Q',
        '_',
        'Util'
    )
);

/**
 * loggerFactory returns a Logger instance.
 * @private
 * @param  {postal} postal Postal Instance.
 * * @param  {configuration} configuration Configuration Instance.
 * * @param  {Q} Q Q Instance.
 * * @param  {di.Injector} injector Dependency Injector.
 * @return {Logger} a Logger instance.
 */
function loggerFactory(
    Constants,
    assert,
    loggingProtocol,
    LogEvent,
    waterline,
    configuration,
    tracer,
    Q,
    _,
    util
) {
    var levels = _.keys(Constants.Logging.Levels);

    /**
     * Logger is a logger class which provides methods for logging based
     * on log levels with mesages & metadata provisions.  The Logger sends
     * all log method calls to the logger postal channel for consumption by other
     * services.
     *  logger.info('Your message here...', { hello: 'world', arbitrary: 'meta data object'});
     * @constructor
     */
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

    /**
     * _log
     * @param {string} level Log Level
     * @param {string} message Log Message
     * @param {object} metadata Log Metadata (Optional)
     * @private
     */
    Logger.prototype.log = function (level, message, context) {
        var self = this;

        assert.isIn(level, levels);
        assert.string(message, 'message');

        return LogEvent.create(
            self.module, level, message, context || {}
        ).then(function (log) {
            return log.print();
        }).then(function (log) {
            loggingProtocol.publishLog(log.level, log);
            return log;
        }).then(function(log) {
            return waterline.logs.create({
                module: self.module,
                level: level,
                message: message,
                context: log.context,
                trace: log.trace,
                timestamp: log.timestamp,
                caller: log.caller,
                subject: log.subject,
                host: os.hostname()
            }).catch(function(error) {
                console.log("Error persisting log message: " + error);
            });
        }).catch(function (error) {
            /* istanbul ignore next */
            console.log(error);

            /* istanbul ignore next */
            console.log(error.stack);
        });
    };

    // Iterate the available levels and create the appropriate prototype function.
    _.keys(Constants.Logging.Levels).forEach(function(level) {
        /**
         * level - Helper method to allow logging by using the specific level
         * as the method instead of calling log directly.
         * @param {string} message Log Message
         * @param {object} metadata Log Metadata (Optional)
         */
        Logger.prototype[level] = function (message, context) {
            this.log(level, message, context);
        };
    });

    Logger.initialize = function (module) {
        return new Logger(module);
    };

    return Logger;
}

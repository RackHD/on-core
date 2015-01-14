// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di');

module.exports = loggerFactory;

di.annotate(loggerFactory, new di.Provide('Logger'));
di.annotate(loggerFactory,
    new di.Inject(
        'Constants',
        'Assert',
        'Protocol.Logging',
        'Protocol.Objects.LogEvent',
        'Services.Configuration',
        'Tracer',
        'Q',
        '_'
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
    configuration,
    tracer,
    Q,
    _
) {

    /**
     * Logger is a logger class which provides methods for logging based
     * on log levels with mesages & metadata provisions.  The Logger sends
     * all log method calls to the logger postal channel for consumption by other
     * services.
     *  logger.info('Your message here...', { hello: 'world', arbitrary: 'meta data object'});
     * @constructor
     */
    function Logger (module) {
        // Set the intiial module to the provided string value if present.
        this.module = module !== undefined ? module.toString() : 'No Module';

        // If the module is a function then we'll look for di.js annotations to get the
        // provide string.
        if (_.isFunction(module)) {
            if (module.annotations && module.annotations.length) {
                var provides = _.detect(module.annotations, function (annotation) {
                    return _.has(annotation, 'token');
                });

                if (provides) {
                    this.module = provides.token;
                    return;
                }
            }

            if (module.name) {
                this.module = module.name;
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
        assert.string(level, 'Must specifiy a level.');
        assert.ok(_.has(Constants.Logging.Levels, level), 'Invalid level specified.');

        assert.string(message, 'Must specify a message.');

        if (context) {
            assert.object(context, 'Context must be an object if specified.');
        }

        LogEvent.create(
            this.module, level, message, context || {}
        ).then(function (log) {
            return log.print();
        }).then(function (log) {
            return loggingProtocol.publishLog(log.level, log);
        }).catch(function (error) {
            // console.log(error);
            // console.log(error.stack);
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

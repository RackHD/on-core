// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di'),
    trace = require('stack-trace'),
    pretty = require('prettyjson'),
    colors = require('colors/safe');

module.exports = loggerFactory;

di.annotate(loggerFactory, new di.Provide('Logger'));
di.annotate(loggerFactory,
    new di.Inject(
        'Constants',
        'Services.Configuration',
        'Q',
        '_',
        di.Injector
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
function loggerFactory(Constants, configuration, Q, _, injector) {
    var levels = {
        emerg: 8,
        alert: 7,
        crit: 6,
        error: 5,
        warning: 4,
        notice: 3,
        info: 2,
        debug: 1,
        silly: 0
    };

    colors.setTheme({
      emerg: 'red',
      alert: 'yellow',
      crit: 'red',
      error: 'red',
      warning: 'red',
      notice: 'yellow',
      info: 'green',
      debug: 'blue',
      silly: 'rainbow'
    });

    var baseDirectory = process.cwd();

    var redacted = [
        'id',
        Constants.LOGGER_EVENT_META_ID,
        Constants.LOGGER_EVENT_META_IDENTIFIER,
        Constants.LOGGER_EVENT_META_IP,
        Constants.LOGGER_EVENT_META_MACADDRESS
    ];

    /**
     * Logger is a logger class which provides methods for logging based
     * on log levels with mesages & metadata provisions.  The Logger sends
     * all log method calls to the logger postal channel for consumption by other
     * services.
     *  logger.info('Your message here...', { hello: 'world', arbitrary: 'meta data object'});
     * @constructor
     */
    function Logger (context) {
        this.context = context !== undefined ? context.toString() : 'No Context';

        if (_.isFunction(context)) {
            if (context.annotations && context.annotations.length) {
                var provides = _.detect(context.annotations, function (annotation) {
                    return _.has(annotation, 'token');
                });

                if (provides) {
                    this.context = provides.token;
                    return;
                }
            }
        }

        console.log(this.context);
    }

    /**
     * log
     * @param {string} level Log Level
     * @param {string} message Log Message
     * @param {object} metadata Log Metadata (Optional)
     */
    Logger.prototype.log = function () {
        this._log.apply(this, Array.prototype.slice.call(arguments));
    };

    /**
     * _log
     * @param {string} level Log Level
     * @param {string} message Log Message
     * @param {object} metadata Log Metadata (Optional)
     * @private
     */
    Logger.prototype._log = function () {
        var self = this;

        this._parse(
            _.flatten(Array.prototype.slice.call(arguments))
        ).then(function (args) {
            return self._translate(args);
        }).then(function (args) {
            return self._write(args);
        }).then(function (args) {
            return self._publish(args);
        }).fail(function (err) {
            self.error(err.message, { error: err });
        });
    };

    _.keys(levels).forEach(function(level) {
        /**
         * level - Helper method to allow logging by using the specific level
         * as the method instead of calling log directly.
         * @param {string} message Log Message
         * @param {object} metadata Log Metadata (Optional)
         */
        Logger.prototype[level] = function () {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(level);
            this._log.apply(this, args);
        };
    });

    /**
     * Converts the provided arguments into an object for further processing.
     * @private
     * @param  {array} args Array of arguments to the original call.
     * @return {object} An object for further processing.
     */
    Logger.prototype._parse = function(args) {
        args = args || [];

        var parsed = {};

        // Get the level from the caller.
        parsed.level = args.shift();

        // Verify the level
        if (!_.contains(_.keys(levels), parsed.level)) {
            args.unshift(parsed.level);

            // Set the level to invalid so we can root out bad log calls.
            parsed.level = 'invalid';
        }

        // Set a timestamp.
        parsed.timestamp = new Date().toISOString();

        // Get the message.
        parsed.message = args.shift();

        // Get the meta data similar to how Winston worked.
        if (_.isObject(args[args.length - 1])) {
            parsed.meta = args.pop();
        }

        // Leftover arguments from legacy calls.
        if (args.length) {
            parsed.message = _.flatten([ parsed.message, args ]);
        }

        if (configuration.get('verbose')) {
            parsed.caller = this._getCaller(4);
        }

        return Q.resolve(parsed);
    };

    /**
     * Translates the meta data from the call into an identifier and returns the updated args.
     * @private
     * @param  {object} args Object from the parse call.
     * @return {object} Updated object from the parse call.
     */
    Logger.prototype._translate = function(args) {
        var self = this;

        if (args.meta === undefined) {
            return self._redact(args);
        }

        if (args.meta.id) {
            return self._redact(args, args.meta.id);
        }

        if (args.meta._id) {
            return self._redact(args, args.meta._id);
        }

        if (args.meta.identifier) {
            return self._redact(args, args.meta.identifier);
        }

        if (args.meta.macaddress) {
            return injector.get('Services.Lookup')
                .macAddressToNodeId(args.meta.macaddress).then(function (identifier) {
                    return self._redact(args, identifier);
                }).fail(function() {
                    return self._redact(args);
                });
        }

        if (args.meta.ip) {
            return injector.get('Services.Lookup')
                .ipAddressToNodeId(args.meta.ip).then(function (identifier) {
                    return self._redact(args, identifier);
                }).fail(function() {
                    return self._redact(args);
                });
        }

        return self._redact(args);
    };

    /**
     * Writes the parsed object to the console and returns it.
     * @param  {object} args Object from the translate call.
     * @return {object} The object from the translate call.
     */
    Logger.prototype._write = function(args) {
        if (args.caller) {
            console.log(args.caller);
        }

        console.log(
            args.timestamp +
            ': ' +
            '[' + this.context + ']' +
            '[' + args.meta.identifier.substring(args.meta.identifier.length - 6) + '] ' +
            this._color(args.level) +
            ' ' + args.message
        );

        if (_.keys(_.omit(args.meta, 'identifier')).length !== 0) {
            console.log(
                pretty.render(
                    _.omit(args.meta, 'identifier'),
                    { noColor: !configuration.get('color') }
                )
            );
        }

        return Q.resolve(args);
    };

    /**
     * Publishess the parsed object to the postal channel and returns it.
     * @param  {object} args Object from the translate call.
     * @return {object} Object from the translate call.
     */
    Logger.prototype._publish = function(args) {
        // TODO: publish via Protocol.Http
        // postal.publish({
        //     channel: Constants.LOGGER_CHANNEL,
        //     topic: Constants.LOGGER_CHANNEL + '.' + args.level,
        //     data:  args
        // });

        return Q.resolve(args);
    };

    /**
     * Redacts the logging metadata and assigns the identifier.
     * @param  {object} args Object from the translate call.
     * @param  {string} identifier The identifier to use for the call.
     * @return {object} Object from translate call with fields redacted.
     */
    Logger.prototype._redact = function(args, identifier) {
        if (args.meta !== undefined) {
            args.meta = _.omit(args.meta, redacted);
        } else {
            args.meta = {};
        }

        args.meta.identifier = identifier || 'server';

        return Q.resolve(args);
    };

    /**
     * _getCaller returns the calling file:line for the original caller of the log statement.
     * @private
     * @return {string} file:line
     */
    Logger.prototype._getCaller = function (depth) {
        var current = trace.get()[depth];

        var file = current.getFileName().replace(baseDirectory, '') + ':' + current.getLineNumber();

        return file.replace(/^node_modules/, '');
    };

    /**
     * _filtered returns whether the requested log level is less than the configured
     * log level thus providing an opportunity for filtering out statements based on
     * level.
     * @param  {string} level One of the available log levels.
     * @return {boolean} true if the log statement is eligible for filtering, false if not.
     */
    Logger.prototype._filtered = function (level) {
        var configured = levels[(configuration.get('level') || 'silly')],
            targeted = levels[level];

        if (configured !== undefined && targeted !== undefined) {
            return targeted < configured;
        } else {
            return false;
        }
    };

    /**
     * _color returns the requested level colored with the current theme if color is enabled.
     * @param  {string} level Log level.
     * @return {string}       Color enabled string suitable for console output.
     */
    Logger.prototype._color = function (level) {
        if (configuration.get('color')) {
            return colors[level](level);
        } else {
            return level;
        }
    };

    Logger.initialize = function (context) {
        return new Logger(context);
    };

    return Logger;
}

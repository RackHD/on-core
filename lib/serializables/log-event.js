// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di'),
    util = require('util');

module.exports = LogEventFactory;

di.annotate(LogEventFactory, new di.Provide('LogEvent'));
di.annotate(LogEventFactory,
    new di.Inject(
        'Errors',
        'Constants',
        'Serializable',
        'Services.Lookup',
        'Assert',
        '_',
        'Tracer',
        'Q',
        'stack-trace',
        'colors',
        'prettyjson',
        'console'
    )
);

function LogEventFactory (
    Errors,
    Constants,
    Serializable,
    lookupService,
    assert,
    _,
    tracer,
    Q,
    stack,
    colors,
    pretty,
    console
) {
    colors.setTheme(Constants.Logging.Colors);

    var rules = {
        module: {
            type: 'string',
            required: true
        },
        level: {
            type: 'string',
            required: true,
            in: _.keys(Constants.Logging.Levels)
        },
        message: {
            type: 'string'
        },
        context: {
            type: 'object',
            required: false
        },
        trace: {
            type: 'string',
            required: true,
            uuidv4: true
        },
        timestamp: {
            type: 'string',
            required: true,
            datetime: true,
        },
        caller: {
            type: 'string',
            required: true
        },
        subject: {
            type: 'string',
            required: true
        }
    };

    function LogEvent(defaults) {
        Serializable.call(this, rules, defaults);
    }

    util.inherits(LogEvent, Serializable);

    Serializable.register(LogEventFactory, LogEvent);

    LogEvent.prototype.print = function () {
        var statement = [];

        this.context = LogEvent.redact(this.context);

        statement.push(this.level[0].toUpperCase());
        statement.push(this.timestamp);
        statement.push('[' +
                this.trace.substring(this.trace.length - Constants.Logging.Context.Length) +
            ']');
        statement.push('[' + this.module + ']');
        statement.push('[' +
                this.subject.substring(this.subject.length - Constants.Logging.Context.Length) +
            ']');
        statement.push(this.message);

        var output = statement.join(' ');

        console.log(colors[this.level](output));
        console.log(' -> ' + this.caller);

        if (_.keys(this.context).length > 0) {
            console.log(
                pretty.render(
                    this.context,
                    { noColor: false }
                )
            );
        }

        return this;
    };

    LogEvent.create = function (options) {
        assert.object(options, 'options');

        return LogEvent.getSubject(options.context)
            .then(function(subject) {
                options.context = LogEvent.sanitize(options.context);
                return new LogEvent(_.merge(options, { subject: subject }));
            }).then(function (object) {
                return object.validate();
            });
    };

    LogEvent.sanitize = function(context) {
        return _.omit(context, Constants.Logging.Sanitizations);
    };

    LogEvent.redact = function (target) {
        return _.transform(target, function (accumulator, value, key) {
            if (_.contains(key, Constants.Logging.Redactions)) {
                accumulator[key] = '[REDACTED]';
            } else {
                accumulator[key] = value;
            }

            if (_.isObject(accumulator[key])) {
                accumulator[key] = LogEvent.redact(accumulator[key]);
            }

            if (_.isArray(accumulator[key])) {
                accumulator[key] = _.map(accumulator[key], function (item) {
                    return LogEvent.redact(item);
                });
            }
        }, target || {});
    };

    LogEvent.getUniqueId = function(context) {
        if (_.isEmpty(context)) {
            return Q.resolve();
        }

        if (context.id) {
            return Q.resolve(context.id);
        }

        if (context.macaddress) {
            return lookupService.macAddressToNodeId(context.macaddress)
                .then(function (identifier) {
                    return identifier;
                });
        }

        if (context.ip) {
            return lookupService.ipAddressToNodeId(context.ip)
                .then(function (identifier) {
                    return identifier;
                });
        }
        // NOTE: This should not be reached
        return Q.resolve();
    };

    LogEvent.getSubject = function(context) {
        var defaultSubject = 'Server';

        return LogEvent.getUniqueId(context)
            .then(function(subject) {
                return subject || defaultSubject;
            })
            .catch(function() {
                return defaultSubject;
            });
    };

    return LogEvent;
}

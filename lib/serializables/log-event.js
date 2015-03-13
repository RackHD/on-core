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
        'Services.Configuration',
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
    configuration,
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

        console.log(configuration.get('color') ? colors[this.level](output) : output);

        if (configuration.get('verbose')) {
            console.log(' -> ' + this.caller);
        }

        if (_.keys(this.context).length > 0) {
            console.log(
                pretty.render(
                    this.context,
                    { noColor: !configuration.get('color') }
                )
            );
        }

        return this;
    };

    LogEvent.create = function (module, level, message, context) {
        assert.string(module, 'module');
        assert.string(level, 'level');
        assert.string(message, 'message');
        assert.object(context, 'context');

        var properties = {
            module: module,
            level: level,
            message: message,
            context: _.merge(context, tracer.active.clone()),
            trace: tracer.active.id,
            timestamp: new Date().toISOString(),
            caller: LogEvent.getCaller(4),
            subject: 'server'
        };

        return LogEvent.getSubject(context)
            .then(function(subject) {
                LogEvent.redact(properties.context);
                return new LogEvent(_.merge(properties, { subject: subject }));
            }).then(function (object) {
                return object.validate();
            });
    };

    LogEvent.redact = function(context) {
        context = _.omit(context, Constants.Logging.Redactions);
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
        var defaultSubject = 'server';
        return LogEvent.getUniqueId(context)
            .then(function(subject) {
                return subject || defaultSubject;
            })
            .catch(function() {
                return defaultSubject;
            });
    };

    LogEvent.getCaller = function (depth) {
        var current = stack.get()[depth];

        var file = current.getFileName().replace(
            Constants.WorkingDirectory,
            ''
        ) + ':' + current.getLineNumber();

        return file.replace(/^node_modules/, '');
    };

    return LogEvent;
}

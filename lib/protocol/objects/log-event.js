// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di'),
    util = require('util');

module.exports = protocolObjectLogEventFactory;

di.annotate(protocolObjectLogEventFactory, new di.Provide('Protocol.Objects.LogEvent'));
di.annotate(protocolObjectLogEventFactory,
    new di.Inject(
        'Errors',
        'Constants',
        'Protocol.Objects.Base',
        'Services.Configuration',
        'Services.Lookup',
        'Assert',
        '_',
        'Tracer',
        'Q',
        'stack-trace',
        'colors',
        'prettyjson'
    )
);

function protocolObjectLogEventFactory (
    Errors,
    Constants,
    Base,
    configuration,
    lookupService,
    assert,
    _,
    tracer,
    Q,
    stack,
    colors,
    pretty
) {
    colors.setTheme(Constants.Logging.Colors);

    function LogEvent(options) {
        Base.call(this, options);
    }

    util.inherits(LogEvent, Base);

    LogEvent.prototype.constraints = function () {
        return {
            module: {
                presence: true
            },
            level: {
                presence: true,
                inclusion: _.keys(Constants.Logging.Levels)
            },
            message: {
                presence: true
            },
            context: {
                // presence triggers on empty objects which are ok here
            },
            trace: {
                presence: true
            },
            timestamp: {
                presence: true
            },
            caller: {
                presence: true
            },
            subject: {
                presence: true,
                numericality: true
            }
        };
    };

    LogEvent.prototype.print = function () {
        var statement = [];

        statement.push(this.timestamp);
        statement.push('[' +
                this.trace.substring(this.trace.length - Constants.Logging.Context.Length) +
            ']');
        statement.push('[' + this.module + ']');
        statement.push(this.level);
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
        assert.string(module);
        assert.string(level);
        assert.string(message);
        assert.object(context);

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
                return new LogEvent(_.merge(properties, { subject: subject }));
            }).then(function (object) {
                return object.validate();
            });
    };

    LogEvent.getSubject = function(context) {
        var defaultSubject = 'server';

        if (_.isEmpty(context)) {
            return Q.resolve(defaultSubject);
        }

        if (context.id) {
            return Q.resolve(context.id);
        }

        if (context.macaddress) {
            return lookupService.macAddressToNodeId(context.macaddress)
                .then(function (identifier) {
                    return identifier || defaultSubject;
                });
        }

        if (context.ip) {
            return lookupService.ipAddressToNodeId(context.ip)
                .then(function (identifier) {
                    return identifier || defaultSubject;
                });
        }
        // NOTE: This should not be reached
        return Q.resolve(defaultSubject);
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

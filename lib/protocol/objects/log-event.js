// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = protocolObjectLogEventFactory;

di.annotate(protocolObjectLogEventFactory, new di.Provide('Protocol.Objects.LogEvent'));
di.annotate(protocolObjectLogEventFactory,
    new di.Inject(
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
    var workingDirectory = process.cwd();

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

    function LogEvent(options) {
        _.defaults(this, options);
    }

    LogEvent.prototype.print = function () {
        var statement = [];

        statement.push(this.timestamp);
        statement.push('[' + this.trace.substring(this.trace.length - 12) + ']');
        statement.push('[' + this.module + ']');
        statement.push(this.level);
        statement.push('[' + this.subject + ']');
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

    LogEvent.getSubject = function(context) {
        var defaultSubject = 'server';
        if (_.isEmpty(context)) {
            return Q.resolve(defaultSubject);
        }
        if (context.id) {
            return Q.resolve(context.id.substring(context.id.length-6));
        }
        if (context.macaddress) {
            return lookupService.macAddressToNodeId(context.macaddress)
                .then(function (identifier) {
                    return identifier.substring(identifier.length-6);
                })
                .catch(function() {
                    return defaultSubject;
                });
        }
        if (context.ip) {
            return lookupService.ipAddressToNodeId(context.ip)
                .then(function (identifier) {
                    return identifier.substring(identifier.length-6);
                })
                .catch(function() {
                    return defaultSubject;
                });
        }
        // NOTE: This should not be reached
        return Q.resolve(defaultSubject);
    };

    LogEvent.prototype.prepare = function () {
        return Q.resolve(this);
    };

    LogEvent.getCaller = function (depth) {
        var current = stack.get()[depth];

        var file = current.getFileName().replace(
            workingDirectory,
            ''
        ) + ':' + current.getLineNumber();

        return file.replace(/^node_modules/, '');
    };

    LogEvent.create = function (module, level, message, context) {
        assert.string(module);
        assert.string(level);
        assert.string(message);
        assert.object(context);

        var traceContext = _.merge(context, tracer.active.clone());
        var traceId = tracer.active.id;

        return LogEvent.getSubject(context)
            .then(function(subject) {
                var properties = {
                    module: module,
                    level: level,
                    message: message,
                    context: traceContext,
                    trace: traceId,
                    timestamp: new Date().toISOString(),
                    caller: LogEvent.getCaller(4),
                    subject: subject
                };

                return new LogEvent(properties);
            });
    };

    return LogEvent;
}

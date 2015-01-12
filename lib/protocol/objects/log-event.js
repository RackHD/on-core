// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = protocolObjectLogEventFactory;

di.annotate(protocolObjectLogEventFactory, new di.Provide('Protocol.Objects.LogEvent'));
di.annotate(protocolObjectLogEventFactory,
    new di.Inject(
        'Services.Configuration',
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

        // TODO: integrate _translate on the properties object prior to
        // creating the new LogEvent object.  This is where we should do
        // lookups to identify mac/ip to node translations where applicable.
        // Set the subject property to the result if it's known and trim it
        // to 6 characters.
        return Q.resolve(
            new LogEvent(properties)
        );
    };

    return LogEvent;
}

/*
    TODO: this code is suitable for the create step which returns a promise.
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
 */
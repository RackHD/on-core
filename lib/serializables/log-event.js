// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = LogEventFactory;

LogEventFactory.$provide = 'LogEvent';
LogEventFactory.$inject = [
    'Errors',
    'Constants',
    'Serializable',
    'Services.Lookup',
    'Assert',
    '_',
    'Promise',
    'stack-trace',
    'colors',
    'prettyjson',
    'console'
];

function LogEventFactory (
    Errors,
    Constants,
    Serializable,
    lookupService,
    assert,
    _,
    Promise,
    stack,
    colors,
    pretty,
    console
) {
    colors.setTheme(Constants.Logging.Colors);

    function LogEvent(defaults) {
        Serializable.call(this, LogEvent.schema, defaults);
    }

    LogEvent.schema = {
        id: 'LogEvent',
        type: 'object',
        properties: {
            package: {
                type: 'string',
            },
            host: {
                type: 'string'
            },
            module: {
                type: 'string'
            },
            level: {
                type: 'string',
                enum: _.keys(Constants.Logging.Levels)
            },
            message: {
                type: 'string'
            },
            context: {
                type: 'object'
            },
            timestamp: {
                type: 'string',
            },
            caller: {
                type: 'string'
            },
            subject: {
                type: 'string'
            }
        },
        required: [ 'module', 'level', 'timestamp', 'caller', 'subject' ]
    };

    Serializable.register(LogEventFactory, LogEvent);

    LogEvent.prototype.print = function () {
        var statement = [];

        this.context = LogEvent.redact(this.context);

        statement.push(this.level[0].toUpperCase());
        statement.push(this.timestamp);
        statement.push('[%s]'.format(this.name));
        statement.push('[%s]'.format(this.module));
        statement.push('[%s]'.format(
            this.subject.substring(this.subject.length - Constants.Logging.Context.Length)
        ));
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
            return Promise.resolve();
        }

        if (context.id) {
            return Promise.resolve(context.id);
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
        return Promise.resolve();
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

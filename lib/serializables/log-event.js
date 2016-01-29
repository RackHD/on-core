// Copyright 2015, EMC, Inc.

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
    //default turn off the colorful output to achieve tidy and clean log file.
    LogEvent.colorEnable = false;

    colors.setTheme(Constants.Logging.Colors); //setTheme will not impact color enable or not

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
        statement.push('[%s]'.format(this.level));
        statement.push('[%s]'.format(this.timestamp));
        statement.push('[%s]'.format(this.name));
        statement.push('[%s]'.format(this.module));
        statement.push('[%s]'.format(
            this.subject.substring(this.subject.length - Constants.Logging.Context.Length)
        ));
        statement.push(this.message);

        var output = statement.join(' ');

        console.log(colors[this.level](output));
        console.log(colors[this.level](' -> ' + this.caller));

        if (_.keys(this.context).length > 0) {
            console.log(
                pretty.render(
                    this.context,
                    {
                        noColor: !LogEvent.colorEnable,
                        numberColor: 'cyan'
                    }
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

    /**
     * Set enabled or disabled for colorful log
     * @param {boolean} enable - true to enable colorful log; false to disable
     */
    LogEvent.setColorEnable = function(enable) {
        LogEvent.colorEnable = (enable ? true : false);
        colors.enabled = LogEvent.colorEnable;
    };

    LogEvent.sanitize = function(context) {
        return _.omit(context, Constants.Logging.Sanitizations);
    };

    LogEvent.redact = function (target) {
        return LogEvent._redact(_.cloneDeep(target));
    };

    LogEvent._redact = function (target) {
        return _.transform(target, function (accumulator, value, key) {
            if (_.contains(key, Constants.Logging.Redactions)) {
                accumulator[key] = '[REDACTED]';
            } else {
                accumulator[key] = value;
            }

            if (_.isObject(accumulator[key])) {
                accumulator[key] = LogEvent._redact(accumulator[key]);
            }

            if (_.isArray(accumulator[key])) {
                accumulator[key] = _.map(accumulator[key], function (item) {
                    return LogEvent._redact(item);
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

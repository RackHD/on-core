// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di');

module.exports = loggerFactory;

di.annotate(loggerFactory, new di.Provide('Logger'));
di.annotate(loggerFactory,
    new di.Inject(
        'Events',
        'Constants',
        'Assert',
        '_',
        'Util',
        'stack-trace',
        'Tracer'
    )
);

/**
 * loggerFactory returns a Logger instance.
 * @private
 */
function loggerFactory(
    events,
    Constants,
    assert,
    _,
    util,
    stack,
    tracer
) {
    var levels = _.keys(Constants.Logging.Levels);

    function getCaller (depth) {
        var current = stack.get()[depth];

        var file = current.getFileName().replace(
            Constants.WorkingDirectory,
            ''
        ) + ':' + current.getLineNumber();

        return file.replace(/^node_modules/, '');
    }

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

    Logger.prototype.log = function (level, message, context) {
        assert.isIn(level, levels);
        assert.string(message, 'message');

        events.emit('log', {
            module: this.module,
            level: level,
            message: message,
            context: _.merge(context || {}, tracer.active.clone()),
            trace: tracer.active.id,
            timestamp: new Date().toISOString(),
            caller: getCaller(3),
            subject: 'Server'
        });
    };

    _.forEach(levels, function(level) {
        Logger.prototype[level] = function (message, context) {
            this.log(level, message, context);
        };
    });

    Logger.prototype.deprecate = function (message, frames) {
        console.error([
            'DEPRECATION:',
            this.module,
            '-',
            message,
            getCaller(frames || 2)
        ].join(' '));
    };

    Logger.initialize = function (module) {
        return new Logger(module);
    };

    return Logger;
}


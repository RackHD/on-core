// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */
'use strict';

var di = require('di'),
    util = require('util');

module.exports = statsdServiceFactory;

di.annotate(statsdServiceFactory, new di.Provide('Services.StatsD'));
di.annotate(statsdServiceFactory,
    new di.Inject(
        'Q',
        'Services.Configuration',
        'Logger',
        'node-statsd',
        'memwatch'
    )
);

function statsdServiceFactory(Q, configuration, Logger, statsd, memwatch) {
    var logger = Logger.initialize(statsdServiceFactory);

    function StatsDService (options) {
        statsd.StatsD.call(this, options);
    }

    util.inherits(StatsDService, statsd.StatsD);

    StatsDService.prototype.start = function () {
        if (this.started) {
            return;
        }

        memwatch.on('leak', this.handleLeak.bind(this));
        memwatch.on('stats', this.handleStats.bind(this));

        this.started = true;

        return Q.resolve();
    };

    StatsDService.prototype.handleLeak = function (info) {
        logger.warning('memwatch leak', info);
    };

    StatsDService.prototype.handleStats = function (stats) {
        this.gauge('memwatch.estimated_base', stats.estimated_base); //jshint ignore:line
        this.gauge('memwatch.current_base', stats.current_base); //jshint ignore:line
        this.gauge('memwatch.min', stats.min);
        this.gauge('memwatch.max', stats.max);
        this.gauge('memwatch.usage_trend', stats.usage_trend); //jshint ignore:line
    };

    StatsDService.prototype.stop = function () {
        if (this.started) {
            memwatch.removeListener('leak', this.handleLeak);
            memwatch.removeListener('stats', this.handleStats);

            this.started = false;
        }

        return Q.resolve();
    };

    return new StatsDService(
        {
            provider: configuration.get('statsdHost') || 'localprovider',
            port: configuration.get('statsdPort') || 8125,
            prefix: configuration.get('statsdPrefix') || '',
            suffix: configuration.get('statsdSuffix') || ''
        }
    );
}
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
        'node-statsd'
    )
);

function statsdServiceFactory(Q, configuration, statsd) {
    var uuidv4 = /\.[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
        bsonid = /\.[0-9A-F]{24}$/i;

    function StatsDService (options) {
        statsd.StatsD.call(this, options);
    }

    util.inherits(StatsDService, statsd.StatsD);

    StatsDService.prototype.start = function () {
        return Q.resolve();
    };

    StatsDService.prototype.stop = function () {
        return Q.resolve();
    };

    StatsDService.prototype.sanitize = function (key) {
        key = key || '';
        return key.replace(uuidv4, '').replace(bsonid, '');
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

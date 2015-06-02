// Copyright (c) 2015, EMC Corporation
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
        'node-statsd',
        'Assert'
    )
);

function statsdServiceFactory(Q, configuration, statsd, assert) {
    var uuidv4 = /\.[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
        bsonid = /\.[0-9A-F]{24}$/i;

    function StatsDService () {
    }

    util.inherits(StatsDService, statsd.StatsD);

    StatsDService.prototype.start = function () {
        // This delays the use of configuration until configuration has been started.
        statsd.StatsD.call(this, {
            host: configuration.get('statsdHost', '127.0.0.1'),
            port: configuration.get('statsdPort', 8125),
            prefix: configuration.get('statsdPrefix', ''),
            suffix: configuration.get('statsdSuffix', '')
        });

        return Q.resolve();
    };

    StatsDService.prototype.stop = function () {
        return Q.resolve();
    };

    StatsDService.prototype.sanitize = function (key) {
        assert.string(key, 'key');

        return key.replace(uuidv4, '').replace(bsonid, '');
    };

    return new StatsDService();
}


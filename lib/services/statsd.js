// Copyright 2015, EMC, Inc.

'use strict';

module.exports = statsdServiceFactory;

statsdServiceFactory.$provide = 'Services.StatsD';
statsdServiceFactory.$inject = [
    'Util',
    'Promise',
    'Services.Configuration',
    'node-statsd',
    'Assert',
    'Constants'
];

function statsdServiceFactory(
    util,
    Promise,
    configuration,
    statsd,
    assert,
    Constants
) {
    var uuidv4 = /\.[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
        bsonid = /\.[0-9A-F]{24}$/i;

    function StatsDService () {}

    util.inherits(StatsDService, statsd.StatsD);

    StatsDService.prototype.start = function () {
        var config = configuration.get('statsd', '127.0.0.1:8125'),
            host = config.split(/\:/)[0],
            port = parseInt(config.split(/\:/)[1] || 8125);

        statsd.StatsD.call(this, {
            host: host,
            port: port,
            prefix: '%s.%s.'.format(Constants.Host, Constants.Name),
            suffix: ''
        });

        this.increment('process.started');

        this.started = true;

        return Promise.resolve();
    };

    StatsDService.prototype.stop = function () {
        this.increment('process.stopped');

        this.started = false;

        return Promise.resolve();
    };

    StatsDService.prototype.sanitize = function (key) {
        assert.string(key, 'key');

        return key.replace(uuidv4, '').replace(bsonid, '');
    };

    return new StatsDService();
}

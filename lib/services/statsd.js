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
    'Constants',
    'gc-stats',
    'flat',
    '_'
];

function statsdServiceFactory(
    util,
    Promise,
    configuration,
    statsd,
    assert,
    Constants,
    GcStats,
    flat,
    _
) {
    var uuidv4 = /\.[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
        bsonid = /\.[0-9A-F]{24}$/i,
        gcTypes = ['invalid', 'minor', 'major', 'both'];

    function StatsDService () {
        this.stats = new GcStats();
        this.stats.on('stats', this.publish.bind(this));
    }

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

    StatsDService.prototype.publish = function (data) {
        if (this.started) {
            var self = this,
                stats = _.omit(flat(data), 'pause', 'pauseMS', 'gctype');

            _.forIn(stats, function (value, key) {
                self.gauge('process.gc.%s.%s'.format(key, gcTypes[data.gctype]), value);
            });
        }
    };

    StatsDService.prototype.sanitize = function (key) {
        assert.string(key, 'key');

        return key.replace(uuidv4, '').replace(bsonid, '');
    };

    return new StatsDService();
}

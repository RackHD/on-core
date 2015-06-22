// Copyright (c) 2015, EMC Corporation

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

function statsdServiceFactory(util, Promise, configuration, statsd, assert, Constants) {
    var uuidv4 = /\.[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
        bsonid = /\.[0-9A-F]{24}$/i;

    function StatsDService () {
    }

    util.inherits(StatsDService, statsd.StatsD);

    StatsDService.prototype.start = function () {
        statsd.StatsD.call(this, {
            host: configuration.get('statsdHost', '127.0.0.1'),
            port: configuration.get('statsdPort', 8125),
            prefix: '%s.%s.'.format(Constants.Host, Constants.Name),
            suffix: ''
        });

        this.increment('process.started');

        return Promise.resolve();
    };

    StatsDService.prototype.stop = function () {
        var self = this;

        return Promise.resolve()
        .then(function () {
            self.increment('process.stopped');
        })
        .then(function () {
            self.close();
        });
    };

    StatsDService.prototype.sanitize = function (key) {
        assert.string(key, 'key');

        return key.replace(uuidv4, '').replace(bsonid, '');
    };

    return new StatsDService();
}


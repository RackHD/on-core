// Copyright 2016, EMC, Inc.

'use strict';

module.exports = heartbeatServiceFactory;

heartbeatServiceFactory.$provide = 'Services.Heartbeat';
heartbeatServiceFactory.$inject = [
    'Promise',
    'Services.Configuration',
    'Assert',
    'Constants',
    'Rx',
    'Protocol.Events',
    'Result',
    'Logger'
];

function heartbeatServiceFactory(
    Promise,
    configuration,
    assert,
    Constants,
    Rx,
    events,
    Result,
    Logger
) {
    var logger = Logger.initialize(heartbeatServiceFactory);

    function HeartbeatService () {
        this.intervalSec = parseInt(configuration.get(
            'heartbeatIntervalSec', 
            Constants.Heartbeat.defaultIntervalSec
        ));
        this.name = Constants.Name;
        this.info = {
            name: this.name,
            title: process.title,
            pid: process.pid,
            uid: process.getuid(),
            platform: process.platform,
            release: process.release,
            versions: process.versions,
            memoryUsage: process.memoryUsage()
        };
        this.eventTypeId = null;
    }
    
    HeartbeatService.prototype.requireDns = function() {
        return Promise.promisifyAll(require('dns'));
    };
    
    HeartbeatService.prototype.getCpuUsage = function() {
        if(process.cpuUsage) {
            return process.cpuUsage(this.startCpuUsage);
        }
        return 'NA'; // Added in: v6.1.0
    };

    HeartbeatService.prototype.getFqdn = Promise.method(function() {
        var self = this;
        var dns = self.requireDns();
        if(dns.lookupServiceAsync) {
            return Promise.resolve(Constants.Host, {hints: dns.ADDRCONFIG})
            .then(dns.lookupAsync)
            .then(function(ip) {
                return dns.lookupServiceAsync(ip[0], 0)
                .then(function(fqdn, service) {
                    return fqdn[0];
                });
            })
            .catch(function() {
                return Constants.Host;
            });
        }
        return Constants.Host;
    });

    HeartbeatService.prototype.isRunning = function() {
        return this.running;
    };

    HeartbeatService.prototype.sendHeartbeat = function() {
        var self = this;

        return events.publishHeartbeatEvent(self.eventTypeId, self.info)
        .then(function() {
            self.lastUpdate = self.info.currentTime;
        });
    };

    HeartbeatService.prototype.start = function () {
        var self = this;
        if(this.intervalSec > 0) { // setting interval to 0 disables heartbeat
            return self.getFqdn().then(function(fqdn) {
                self.running = true;
                self.subscription = Rx.Observable.interval(self.intervalSec * 1000)
                .takeWhile(self.isRunning.bind(self))
                .subscribe(
                    function() {
                        self.info.currentTime = new Date();
                        self.info.nextUpdate = new Date(
                            self.info.currentTime.valueOf() + self.intervalSec * 1000
                        );
                        self.info.lastUpdate = self.lastUpdate;
                        self.info.memoryUsage = process.memoryUsage();
                        self.info.cpuUsage = self.getCpuUsage();
                        self.eventTypeId = fqdn + "." + self.name;
                        self.sendHeartbeat();
                    },
                    function(error) {
                        if(error) {
                            logger.error('Heartbeat service error', {error:error});
                        }
                    }
                );

                return self.subscription;
            });
        }
    };

    HeartbeatService.prototype.stop = Promise.method(function () {
        this.running = false;
        if(this.subscription) {
            this.subscription.dispose();
        }
    });

    return new HeartbeatService();
}

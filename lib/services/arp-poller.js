// Copyright 2016, EMC, Inc.

'use strict';

var di = require('di');

module.exports = arpPollerFactory;
di.annotate(arpPollerFactory, new di.Provide('Services.ArpPoller'));
di.annotate(arpPollerFactory, new di.Inject(
    'Services.Lookup',
    'Services.Waterline',
    'Logger',
    'Promise',
    'Rx',
    'Assert',
    'Util',
    '_',
    'fs',
    'Services.Configuration'
));

function arpPollerFactory(
    lookupService,
    waterline,
    Logger,
    Promise,
    Rx,
    assert,
    util,
    _,
    nodeFs,
    configuration
) {
    var logger = Logger.initialize(arpPollerFactory);
    var fs = Promise.promisifyAll(nodeFs);

    /**
     *
     * @param {Object} options
     * @param {Object} context
     * @param {String} taskId
     * @constructor
     */
    function ArpPollerService() {
        this.pollIntervalMs = 1000;
        this.last = [];
        this.current = [];
    }

    ArpPollerService.prototype.parseArpCache = function() {
        return fs.readFileAsync('/proc/net/arp')
        .then(function(data) {
            var cols, lines, entries = [];
            lines = data.toString().split('\n');
            _.forEach(lines, function(line, index) {
                if(index !== 0) {
                    cols = line.replace(/ [ ]*/g, ' ').split(' ');
                    if((cols.length > 3) && 
                       (cols[0].length !== 0) && 
                       (cols[3].length !== 0)) {
                        entries.push({ 
                            ip: cols[0], 
                            mac: cols[3], 
                            iface: cols[5], 
                            flag: cols[2]
                        });
                    }
                }
            });
            return entries;
        })
        .catch(function(err) {
            logger.error('ARP Read Error', {error:err});
            throw err;
        });
    };
    
    ArpPollerService.prototype.arpCacheHandler = function() {
        var self = this;
        return self.parseArpCache()
        .then(function(data) {
            self.current = data;
            var updated = _.merge(_(self.last)
            .filter(function(e) {
                return _.isUndefined(_.find(self.current, e));
            })
            .value(), _(self.current)
            .filter(function(e) {
                return _.isUndefined(_.find(self.last, e));
            })
            .value());
                        
            if(updated.length) {
                return Promise.map(updated, function(entry) {
                    if(entry.flag === '0x0') {  // incomplete or removed entry
                        logger.debug('Remove Lookup', {entry:entry});
                        // Just invalidate the IP to preserve the MAC to nodeId mapping
                        return waterline.lookups.setIp(null, entry.mac);
                    } else { // set static or dynamic entry
                        logger.debug('Add/Update Lookup', {entry:entry});
                        return waterline.lookups.setIp(entry.ip, entry.mac);
                    }
                });
            }
        })
        .catch(function(error) {
            logger.error('Error Handling ARP Entry', {error:error});
            throw error;
        })
        .finally(function() {
            self.last = self.current;
        });
    };
    

    /**
     * @memberOf ArpPollerService
     */
    ArpPollerService.prototype._run = function() {
        var self = this;
        this.subscription = Rx.Observable.interval(self.pollIntervalMs)
        .subscribe(
            self.arpCacheHandler.bind(self),
            function(error) {
                logger.error('ARP Poller Error', {error:error});
            }
        );
    };
    
    ArpPollerService.prototype.start = Promise.method(function() {
        if(configuration.get('arpPollerEnabled', true)) {
            this._run();
        }
        return;
    });
    
    ArpPollerService.prototype.stop = Promise.method(function() {
        if(this.subscription) {
            this.subscription.dispose();
            this.subscription = undefined;
        }
        return;
    });

    return new ArpPollerService();
}

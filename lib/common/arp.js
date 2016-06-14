// Copyright 2016, EMC, Inc.

'use strict';

module.exports = arpCacheFactory;
arpCacheFactory.$provide = 'ARPCache';
arpCacheFactory.$inject = [
    'Logger',
    'Promise',
    'Assert',
    'Util',
    '_',
    'fs'
];

function arpCacheFactory(
    Logger,
    Promise,
    assert,
    util,
    _,
    nodeFs
) {
    var logger = Logger.initialize(arpCacheFactory);
    var fs = Promise.promisifyAll(nodeFs);

    /**
     *
     * @param {Object} options
     * @param {Object} context
     * @param {String} taskId
     * @constructor
     */
    function ARPCache() {
        this.last = [];
        this.current = [];
    }

    ARPCache.prototype.parseArpCache = function() {
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
    
    ARPCache.prototype.getCurrent = function() {
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
                    if(entry.flag !== '0x0') { 
                        return { 
                            ip: entry.ip, 
                            mac: entry.mac 
                        };
                    }
                });
            }
        })
        .then(function(entries) {
            return _(entries).filter(function(entry) {
                return entry;
            }).value();
        })
        .catch(function(error) {
            logger.error('Error Handling ARP Entry', {error:error});
            throw error;
        })
        .finally(function() {
            self.last = self.current;
        });
    };
    
    return new ARPCache();
}

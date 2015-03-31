// Copyright 2014-2015, Renasar Technologies Inc.
/* jshint node: true */

"use strict";

var di = require('di');

module.exports = dhcpLeaseCacheFactory;
di.annotate(dhcpLeaseCacheFactory, new di.Provide('DhcpLeaseCache'));
di.annotate(dhcpLeaseCacheFactory,
    new di.Inject(
        'Services.Waterline',
        'Q',
        '_'
    )
);
/*
 * A basic ip: mac store to be used for cacheing by different DHCP processes
 * such as proxyDHCP, DHCP relay, DHCP server, and DHCP sniffer. Consumed
 * by the LookupService (Services.Lookup) primarily.
 *
 */
function dhcpLeaseCacheFactory(waterline, Q) {
    function DhcpLeaseCache() {}

    DhcpLeaseCache.prototype.getLeaseByIp = function(ip) {
        return waterline.dhcpleases.findOne({ ip: ip });
    };

    DhcpLeaseCache.prototype.setLeaseByIp = function(ip, macAddress) {
        return Q.all([
            waterline.dhcpleases.findOne({ macAddress: macAddress }),
            waterline.dhcpleases.findOne({ ip: ip })
        ])
        .spread(function(docFromMac, docFromIp) {
            // Remove stale information about previous overlapping leases
            if (docFromIp && docFromIp.macAddress !== macAddress) {
                return Q.all([false, waterline.dhcpleases.destroy({ ip: ip })]);
            } else if (docFromMac) {
                // Force Q.all since bluebird-q doesn't natively coerce array
                // return values to .spread
                return Q.all([true]);
            } else {
                return Q.all([false]);
            }
        })
        .spread(function(doUpdate) {
            if (doUpdate) {
                return waterline.dhcpleases.update(
                    { macAddress: macAddress },
                    { ip: ip }
                );
            } else {
                return waterline.dhcpleases.findOrCreate(
                    { macAddress: macAddress },
                    { ip: ip, macAddress: macAddress }
                );
            }
        });
    };

    return new DhcpLeaseCache();
}

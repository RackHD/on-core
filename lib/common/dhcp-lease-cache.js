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
function dhcpLeaseCacheFactory(waterline, Q, _) {
    function DhcpLeaseCache() {}

    DhcpLeaseCache.prototype.getLeaseByIp = function(ip) {
        return waterline.dhcpleases.findOne({ ip: ip });
    };

    DhcpLeaseCache.prototype.setLeaseByIp = function(ip, macAddress) {
        var docFromMac;

        return Q.all([
            waterline.dhcpleases.findOne({ macAddress: macAddress }),
            waterline.dhcpleases.findOne({ ip: ip })
        ])
        .spread(function(_docFromMac, _docFromIp) {
            docFromMac = _docFromMac;
            // Remove stale information about previous overlapping leases
            if (_docFromIp && _docFromIp.macAddress !== macAddress) {
                return waterline.dhcpleases.destroy({ ip: ip });
            }
        })
        .then(function() {
            if (!_.isEmpty(docFromMac)) {
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

// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = dhcpLeaseCacheFactory;

dhcpLeaseCacheFactory.$provide = 'DhcpLeaseCache';
dhcpLeaseCacheFactory.$inject = [
    'Services.Waterline',
    'Promise'
];

/**
 * A basic ip: mac store to be used for cacheing by different DHCP processes
 * such as proxyDHCP, DHCP relay, DHCP server, and DHCP sniffer. Consumed
 * by the LookupService (Services.Lookup) primarily.
 *
 */
function dhcpLeaseCacheFactory(waterline, Promise) {
    /**
     * A simple interface to a waterline store of { macAddress: ip }
     * @constructor
     */
    function DhcpLeaseCache() {}

    /**
     * @typedef LeaseObject
     * @property {String} macAddress
     * @property {String} ip
     */

    /**
     * Gets a LeaseObject by an ipv4 address
     *
     * @method
     * @function
     * @param {String} ip
     * @returns {Promise<LeaseObject>}
     */
    DhcpLeaseCache.prototype.getLeaseByIp = function(ip) {
        return waterline.dhcpleases.findOne({ ip: ip });
    };

    /**
     * Sets a LeaseObject
     *
     * @method
     * @function
     * @param {String} ip
     * @param {String} macAddress
     * @returns {Promise<LeaseObject>}
     */
    DhcpLeaseCache.prototype.setLeaseByIp = function(ip, macAddress) {
        return Promise.all([
            waterline.dhcpleases.findOne({ macAddress: macAddress }),
            waterline.dhcpleases.findOne({ ip: ip })
        ])
        .spread(function(docFromMac, docFromIp) {
            // Remove stale information about previous overlapping leases
            if (docFromIp && docFromIp.macAddress !== macAddress) {
                return Promise.all([false, waterline.dhcpleases.destroy({ ip: ip })]);
            } else if (docFromMac) {
                // Force Promise.all since bluebird-q doesn't natively coerce array
                // return values to .spread
                return Promise.all([true]);
            } else {
                return Promise.all([false]);
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

    /**
     * Removes a LeaseObject
     *
     * @method
     * @function
     * @param {String} macAddress
     * @returns {Promise<LeaseObject>}
     */
    DhcpLeaseCache.prototype.removeLeaseByMacAddress = function(macAddress) {
        return waterline.dhcpleases.destroy({ macAddress: macAddress });
    };

    return new DhcpLeaseCache();
}

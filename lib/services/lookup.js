// Copyright 2014-2015, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');
var lruCache = require('lru-cache');

module.exports = lookupServiceFactory;

di.annotate(lookupServiceFactory, new di.Provide('Services.Lookup'));
di.annotate(lookupServiceFactory,
    new di.Inject(
        'Q',
        'Services.Configuration',
        'Services.Waterline',
        'DhcpLeaseCache',
        'Assert',
        'Errors',
        '_'
    )
);

/**
 * Provides a LookupService singleton.
 * @private
 * @param  {q} Q           q promise library.
 * @param  {configuration} configuration           An instance of configuration.
 * @param  {Waterline} waterline An instance of the Waterline service.
 * @param  {LeaseCache} leaseCache An instance of the LeaseCache.
 * @param  {Assert} assert
 * @param  {Errors} errors
 * @return {LookupService} An instance of the LookupService.
 */
function lookupServiceFactory(Q, configuration, waterline, leaseCache, assert, Errors, _) {
    // TODO: stolen from http-service could stand to be a re-usable helper.
    /**
     * Get remote address of the client.
     * @private
     * @param {req} req from express
     * @returns {String|Undefined} either the ip of requester or undefined
     *                             if unavailable
     */
    function remoteAddress(req) {
        assert.ok(req, 'req');

        if (req.ip) {
            return req.ip;
        }

        if (req._remoteAddress) {
            return req._remoteAddress;
        }

        if (req.connection) {
            return req.connection.remoteAddress;
        }

        return undefined;
    }

    /**
     * Provides functionality to correlate various identifiers
     * to their appropriate counterparts.
     * @constructor
     */
    function LookupService () {
      var macToNodeIdCache = lruCache({
        max: configuration.get('maxWorkflows'),
        maxAge: 10 * 1000
      });

      // Set ip cache age to 1/4 of the lease timer, with a maximum of 1 minute
      var oneMin = 1000 * 60;
      var ipCacheAge = configuration.get('dhcpLeaseExpirationTimer') * 0.25 || oneMin;

      ipCacheAge = ipCacheAge > oneMin ? oneMin : ipCacheAge;

      var ipAddressToMacAddressCache = lruCache({
          max: configuration.get('maxWorkflows'),
          maxAge: configuration.get('dhcpLeaseExpirationTimer')
      });

      Object.defineProperties(this, {
        /**
         * @memberOf LookupService
         * @instance
         * @type {LruCache}
         * @private
         */
        _macToNodeIdCache: { value: macToNodeIdCache },
        _ipAddressToMacAddressCache: { value: ipAddressToMacAddressCache }
      });
    }

    /**
     * Provides a middleware function suitable for
     * looking up the request IP via express and adding a req.macaddress and
     * req.macAddress value representing the MAC address used for the HTTP
     * request.
     * @return {function} An express middleware function.
     */
    LookupService.prototype.ipAddressToMacAddressMiddleware =
      function ipAddressToMacAddressMiddleware() {
        var self = this;

        return function(req, res, next) {
            self.ipAddressToMacAddress(remoteAddress(req)).then(function (macAddress) {
                // Provide both lower case and camel case versions.
                req.macaddress = macAddress;
                req.macAddress = macAddress;
            })
            .fin(function() {
                next();
            });
        };
    };

    /**
     * Converts the given IP address into a MAC address
     * via a lookup in the leaseCache.
     * @param  {String} ip IP Address to correlate to a MAC Address.
     * @return {Promise.<String>}    A promise fulfilled to the MAC address which
     * correlates to the provided IP.
     */
    LookupService.prototype.ipAddressToMacAddress = function ipAddressToMacAddress(ip) {
        assert.isIP(ip);

        var self = this,
            cache = self._ipAddressToMacAddressCache,
            mac = cache.get(ip);

        if (mac) {
            return Q.resolve(mac);
        }

        return leaseCache.getLeaseByIp(ip).then(function(lease) {
            if (_.isEmpty(lease)) {
                return null;
            } else {
                cache.set(ip, lease.macAddress);
                return lease.macAddress;
            }
        });
    };

    /**
     * macAddressToNode converts the given MAC address into a Node document via
     * a lookup in the DomainService.
     * @param  {String} macAddress MAC Address to correlate to a Node.
     * @return {Promise.<NodeDocument>} A promise fulfilled to the Node which
     * correlates to the provided MAC Address.
     */
    LookupService.prototype.macAddressToNode = function macAddressToNode(macAddress) {
        // Convert Waterline Bluebird promise to Q promise.
        return Q.resolve(waterline.nodes.findByIdentifier(macAddress));
    };

    /**
     * Converts the given MAC address into the BSON ID of the node document via
     * a lookup in the DomainService. This function will cache values to avoid
     * excessive round trips to the DB, so its use is recommended when only the
     * BSON ID is needed.
     * @param  {String} macAddress MAC Address to correlate to a Node.
     * @return {Promise.<ObjectId>} A promise fulfilled to the Node ID which
     * correlates to the provided MAC Address.
     */
    LookupService.prototype.macAddressToNodeId = function macAddressToNodeId(macAddress) {
        var self = this,
            cache = self._macToNodeIdCache,
            nodeId = cache.get(macAddress);

        if (nodeId) {
            return Q.resolve(nodeId);
        }

        return self.macAddressToNode(macAddress).then(function(node) {
            if (node) {
                var id = node.id;
                cache.set(macAddress, id);
                return id;
            } else {
                throw new Errors.LookupError('Unable to locate node via MAC address.');
            }
        });
    };

    /**
     * Converts the given IP Address into a Node document via
     * a lookup using the leaseCache & DomainService.
     * @param  {String} ip IP Address to correlate to a Node.
     * @return {Promise.<NodeDocument>} A promise fulfilled to the Node which
     * correlates to the provided IP Address.
     */
    LookupService.prototype.ipAddressToNode = function ipAddressToNode(ip) {
        assert.isIP(ip);

        var self = this;

        return self.ipAddressToMacAddress(ip).then(function (macAddress) {
            if (macAddress) {
                return self.macAddressToNode(macAddress);
            } else {
                return null;
            }
        });
    };

    /**
     * Converts the given IP Address into the BSON ID of the Node via
     * a lookup using the leaseCache & DomainService. This function will cache
     * values to avoid excessive round trips to the DB, so its use is
     * recommended when only the BSON ID is needed.
     * @param  {String} ip IP Address to correlate to a Node.
     * @return {Promise.<ObjectId>} A promise fulfilled to the Node ID which
     * correlates to the provided IP Address.
     */
    LookupService.prototype.ipAddressToNodeId = function ipAddressToNodeId(ip) {
        assert.isIP(ip);

        var self = this;

        return self.ipAddressToNode(ip).then(function (node) {
            if (node) {
                return node.id;
            } else {
                return null;
            }
        });
    };

    LookupService.prototype.start = function start() {
        return Q.resolve();
    };

    LookupService.prototype.stop = function stop() {
        return Q.resolve();
    };

    return new LookupService();
}

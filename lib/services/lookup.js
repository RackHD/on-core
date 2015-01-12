// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di');
var lruCache = require('lru-cache');

module.exports = lookupServiceFactory;

di.annotate(lookupServiceFactory, new di.Provide('Services.Lookup'));
di.annotate(lookupServiceFactory,
    new di.Inject(
        'Q',
        'Services.Configuration',
        'Protocol.Dhcp',
        'Services.Waterline',
        'Assert'
    )
);

/**
 * Provides a LookupService singleton.
 * @private
 * @param  {q} Q           q promise library.
 * @param  {configuration} configuration           An instance of configuration.
 * @param  {DhcpProtocol} dhcpProtocol An instance of the DhcpProtocol.
 * @param  {DomainService} domainService An instance of the DomainService.
 * @return {LookupService} An instance of the LookupService.
 */
function lookupServiceFactory(Q, configuration, dhcpProtocol, waterline, assert) {
    // TODO: stolen from http-service could stand to be a re-usable helper.
    /**
     * Get remote address of the client.
     * @private
     * @param {req} req from express
     * @returns {String|Undefined} either the ip of requester or undefined
     *                             if unavailable
     */
    function remoteAddress(req) {
        assert.ok(req);

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
      Object.defineProperties(this, {
        /**
         * @memberOf LookupService
         * @instance
         * @type {LruCache}
         * @private
         */
        _macToNodeIdCache: { value: macToNodeIdCache }
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
     * via a lookup in the DhcpProtocol.
     * @param  {String} ip IP Address to correlate to a MAC Address.
     * @return {Promise.<String>}    A promise fulfilled to the MAC address which
     * correlates to the provided IP.
     */
    LookupService.prototype.ipAddressToMacAddress = function ipAddressToMacAddress(ip) {
        assert.ok(ip);

        return dhcpProtocol.lookupIpLease(ip).then(function (mac) {
            return mac;
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
        assert.ok(macAddress);

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
                return Q.reject(new Error('Unable to locate node via MAC address.'));
            }
        });
    };

    /**
     * Converts the given IP Address into a Node document via
     * a lookup using the DhcpProtocol & DomainService.
     * @param  {String} ip IP Address to correlate to a Node.
     * @return {Promise.<NodeDocument>} A promise fulfilled to the Node which
     * correlates to the provided IP Address.
     */
    LookupService.prototype.ipAddressToNode = function ipAddressToNode(ip) {
        assert.ok(ip);

        var self = this;

        return self.ipAddressToMacAddress(ip).then(function (macAddress) {
            return self.macAddressToNode(macAddress);
        });
    };

    /**
     * Converts the given IP Address into the BSON ID of the Node via
     * a lookup using the DhcpProtocol & DomainService. This function will cache
     * values to avoid excessive round trips to the DB, so its use is
     * recommended when only the BSON ID is needed.
     * @param  {String} ip IP Address to correlate to a Node.
     * @return {Promise.<ObjectId>} A promise fulfilled to the Node ID which
     * correlates to the provided IP Address.
     */
    LookupService.prototype.ipAddressToNodeId = function ipAddressToNodeId(ip) {
        assert.ok(ip);

        var self = this;

        return self.ipAddressToMacAddress(ip).then(function (macAddress) {
            if (macAddress) {
                return self.macAddressToNodeId(macAddress);
            } else {
                return macAddress;
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

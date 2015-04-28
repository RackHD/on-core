// Copyright 2014-2015, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = lookupServiceFactory;

di.annotate(lookupServiceFactory, new di.Provide('Services.Lookup'));
di.annotate(lookupServiceFactory,
    new di.Inject(
        'Promise',
        'Services.Configuration',
        'Services.Waterline',
        'Assert',
        'Errors',
        '_'
    )
);

/**
 * Provides a LookupService singleton.
 * @private
 * @param  {Promise} Promise
 * @param  {configuration} configuration
 * @param  {Waterline} waterline
 * @param  {Assert} assert
 * @param  {Errors} errors
 * @param  {lodash} _
 * @param  {lru-cache} LRU Cache Package
 *
 * @return {LookupService} An instance of the LookupService.
 */
function lookupServiceFactory(
    Promise,
    configuration,
    waterline,
    assert,
    Errors
) {
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

        // TODO: This doesn't appear to ever get hit and causes an assertion
        // in the IP lookup due to undefined not being an IP so we need to investigate
        // what to do in this particular case (which again doesn't seem to have ever
        // actually occurred)
        return undefined;
    }

    /**
     * Provides functionality to correlate various identifiers
     * to their appropriate counterparts.
     * @constructor
     */
    function LookupService () {
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
            }).finally(function() {
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

        return waterline.lookups.findOneByTerm(ip).then(function (record) {
            return record.macAddress;
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
        // TODO: assert mac

        return waterline.lookups.findOneByTerm(macAddress).then(function (record) {
            if (record.node) {
                return waterline.nodes.needOneById(record.node);
            } else {
                throw new Errors.NotFoundError(
                    'Lookup Record Not Found (macAddressToNode)',
                    record
                );
            }
        });
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
        // throw new Errors.LookupError('Unable to locate node via MAC address.');

        return waterline.lookups.findOneByTerm(macAddress).then(function (record) {
            if (record.node) {
                return record.node;
            } else {
                throw new Errors.NotFoundError(
                    'Lookup Record Not Found (macAddressToNodeId)',
                    record
                );
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

        return waterline.lookups.findOneByTerm(ip).then(function (record) {
            if (record.node) {
                return waterline.nodes.needOneById(record.node);
            } else {
                throw new Errors.NotFoundError(
                    'Lookup Record Not Found (ipAddressToNode)',
                    record
                );
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

        return waterline.lookups.findOneByTerm(ip).then(function (record) {
            if (record.node) {
                return record.node;
            } else {
                throw new Errors.NotFoundError(
                    'Lookup Record Not Found (ipAddressToNodeId)',
                    record
                );
            }
        });
    };

    LookupService.prototype.start = function () {
        return Promise.resolve();
    };

    LookupService.prototype.stop = function stop() {
        return Promise.resolve();
    };

    return new LookupService();
}


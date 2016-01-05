// Copyright 2015, EMC, Inc.

'use strict';

module.exports = lookupServiceFactory;

lookupServiceFactory.$provide = 'Services.Lookup';
lookupServiceFactory.$inject = [
    'Promise',
    'Services.Configuration',
    'Services.Waterline',
    'Assert',
    'Errors',
    '_',
    'lru-cache'
];

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
    Errors,
    _,
    LRU
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
        this.resetNodeIdCache();
    }

    /**
     * Reset all cached Node IDs.
     */
    LookupService.prototype.resetNodeIdCache = function () {
        if (this.nodeIdCache) {
            this.nodeIdCache.reset();
            return;
        }

        this.nodeIdCache = LRU({
            max: 500,
            maxAge: 30000
        });
    };

    /**
     * Reset the cache for a specific IP or MAC address.
     * @param  {String} cache key - IP or MAC address.
     */
    LookupService.prototype.clearNodeIdCache = function (key) {
        this.assignNodeIdCache(key, null);
    };

    LookupService.prototype.clearNodeIdCacheAndThrow = function (key, error) {
        this.clearNodeIdCache(key);

        throw error;
    };

    /**
     * Check the cache for a Node ID by IP or MAC addres.
     * @param  {String} cache key - IP or MAC address.
     * @return {Promise|null} Returns a promise if the Node ID is cached,
                              otherwise null.
     */
    LookupService.prototype.checkNodeIdCache = function (key) {
        var current = this.nodeIdCache.get(key);

        if (current === null || typeof current === 'string') {
            return new Promise(function (resolve, reject) {
                var responder = {resolve: resolve, reject: reject};

                this.handleCachePromise(responder, current);
            }.bind(this));
        }

        if (Array.isArray(current)) {
            return new Promise(function (resolve, reject) {
                var buffer = this.nodeIdCache.get(key),
                    responder = {resolve: resolve, reject: reject};

                if (Array.isArray(buffer)) {
                    buffer.push(responder);
                }

                else {
                    this.handleCachePromise(responder);
                }
            }.bind(this));
        }

        this.nodeIdCache.set(key, []);

        return null;
    };

    /**
     * Cache Node ID by either an IP or MAC address.
     * @param  {String} cache key - IP or MAC address.
     * @param  {String} cache value - Node ID.
     * @return {String} value converted to a string.
     */
    LookupService.prototype.assignNodeIdCache = function(key, value) {
        value = value && value.toString();

        var buffer = this.nodeIdCache.peek(key);

        this.nodeIdCache.set(key, value);

        if (Array.isArray(buffer)) {
            buffer.forEach(function (responder) {
                this.handleCachePromise(responder, value);
            }.bind(this));
        }

        return value;
    };

    LookupService.prototype.handleCachePromise = function (responder, value) {
      if (!value) {
          return responder.reject(
              new Errors.NotFoundError(
                  'Lookup Record Not Found (handleCachePromise)',
                  null
              )
          );
      }

      responder.resolve(value);
    };

    /**
     * Provides a middleware function suitable for
     * looking up the request IP via express and adding a req.macaddress and
     * req.macAddress value representing the MAC address used for the HTTP
     * request.
     * @return {function} An express middleware function.
     */
    LookupService.prototype.ipAddressToMacAddressMiddleware = function () {
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
    LookupService.prototype.ipAddressToMacAddress = function (ip) {
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
    LookupService.prototype.macAddressToNode = function (macAddress) {
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
     * Returns the IP Address associated with the given MAC address.
     * @param {String} macAddress MAC Address to correlate with an IP.
     * @return {Promise.<String>} A promise fulfilled with the IP Address which
     * correlates to the provided MAC Address.
     */
    LookupService.prototype.macAddressToIp = function (macAddress) {
        return waterline.lookups.findOneByTerm(macAddress).then(function (record) {
            if (record.ipAddress) {
                return record.ipAddress;
            } else {
                throw new Errors.NotFoundError(
                    'Lookup Record Not Found (macAddressToIp)',
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
    LookupService.prototype.macAddressToNodeId = function (macAddress) {
        var cachePromise = this.checkNodeIdCache(macAddress);

        if (cachePromise) {
            return cachePromise;
        }

        return waterline.lookups.findOneByTerm(macAddress).then(function (record) {
            if (record.node) {
                return this.assignNodeIdCache(macAddress, record.node);
            }

            else {
                this.clearNodeIdCache(macAddress);

                throw new Errors.NotFoundError(
                    'Lookup Record Not Found (macAddressToNodeId)',
                    record
                );
            }
        }.bind(this)).catch(this.clearNodeIdCacheAndThrow.bind(this, macAddress));
    };

    /**
     * Converts the given IP Address into a Node document via
     * a lookup using the leaseCache & DomainService.
     * @param  {String} ip IP Address to correlate to a Node.
     * @return {Promise.<NodeDocument>} A promise fulfilled to the Node which
     * correlates to the provided IP Address.
     */
    LookupService.prototype.ipAddressToNode = function (ip) {
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
    LookupService.prototype.ipAddressToNodeId = function (ip) {
        assert.isIP(ip);

        var cachePromise = this.checkNodeIdCache(ip);

        if (cachePromise) {
            return cachePromise;
        }

        return waterline.lookups.findOneByTerm(ip).then(function (record) {
            if (record.node) {
                return this.assignNodeIdCache(ip, record.node);
            }

            else {
                this.clearNodeIdCache(ip);

                throw new Errors.NotFoundError(
                    'Lookup Record Not Found (ipAddressToNodeId)',
                    record
                );
            }
        }.bind(this)).catch(this.clearNodeIdCacheAndThrow.bind(this, ip));
    };

    /**
     * Returns a list of IP Addresses for the given Node ID.
     * @param  {String} id Node ID
     * @return {Promise.<Array>} A promise fulfilled with an array of
     * IP Addresses associated with the Node.
     */
    LookupService.prototype.nodeIdToIpAddresses = function (id) {
        assert.isMongoId(id);

        return waterline.lookups.findByTerm(id).then(function (records) {
            return _.reduce(records, function (ipAddresses, record) {
                if (record.ipAddress) {
                    ipAddresses.push(record.ipAddress);
                }

                return ipAddresses;
            }, []);
        });
    };

    LookupService.prototype.setIpAddress = function (ip, mac) {
        return waterline.lookups.setIp(ip, mac);
    };

    LookupService.prototype.start = function () {
        return Promise.resolve();
    };

    LookupService.prototype.stop = function () {
        return Promise.resolve();
    };

    return new LookupService();
}

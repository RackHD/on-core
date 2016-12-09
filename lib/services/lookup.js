// Copyright 2015, EMC, Inc.

'use strict';

module.exports = lookupServiceFactory;

lookupServiceFactory.$provide = 'Services.Lookup';
lookupServiceFactory.$inject = [
    'Promise',
    'Services.Waterline',
    'Services.Configuration',
    'Assert',
    'Errors',
    '_',
    'lru-cache',
    'ARPCache',
    'ChildProcess'
];

/**
 * Provides a LookupService singleton.
 * @private
 * @param  {Promise} Promise
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
    waterline,
    configuration,
    assert,
    Errors,
    _,
    LRU,
    arpCache,
    ChildProcess
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

        if(req.get("X-Real-IP")) {
            return req.get("X-Real-IP");
        }

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
        this.resetMacRequests();
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

    LookupService.prototype.resetMacRequests = function () {
        if (configuration.get('externalLookupHelper', null) != null) {
            this.macRequests = {};
        } else {
            delete this.macRequests;
        }
    }

    /**
     * Look up an entry in the lookups collection by IP. Optionally fall back
     * to other mechanisms if we can't find an entry.
     * @private
     * @param {ip} IP address to look for
     * @returns lookups record
     */
    LookupService.prototype.lookupByIP = function (ip) {
        return this.validateArpCache()
        .then(function() {
            return waterline.lookups.findOneByTerm(ip);
        });
    }

    /**
     * Look up an entry in the lookups collection by MAC. Optionally fall back
     * to other mechanisms if we can't find an entry.
     * @private
     * @param {mac} MAC address to look for
     * @returns lookups record
     */
    LookupService.prototype.lookupByMAC = function (mac) {
        return this.validateArpCache()
        .then(function() {
            return waterline.lookups.findOneByTerm(mac);
        })
        .catch(function (error) {
            var helper = configuration.get('externalLookupHelper', null);
            if (helper != null) {
                return this.runExternalHelper(helper, mac).then(function () {
                    return waterline.lookups.findOneByTerm(mac);
                });
            }
            throw error;
        }.bind(this));
    }

    /**
     * Run an external helper script to fill in missing lookup entries.
     * Only one instance of the helper script is run at any given time for
     * any given MAC address. All other requests will be resolved when the
     * running instance returns.
     * @private
     * @param {helperPath} Path to the lookup script.
     * @param {mac} The MAC address we need information on.
     */
    LookupService.prototype.runExternalHelper = function (helperPath, mac) {
        if (mac in this.macRequests) {
            return new Promise(function (resolve, reject) {
                var responder = {resolve: resolve, reject: reject};
                this.macRequests[mac].push(responder);
            }.bind(this));
        }

        var helper = new ChildProcess(helperPath, [mac]);
        this.macRequests[mac] = [];
        return this.processHelperResults(helper).then(function () {
            this.handleHelperPromises(mac)
        }.bind(this));
    }

    /**
     * Process the output from an external lookup helper script.
     * The expected output is one or more lines of text of the form:
     *    <MAC address> <IP address>
     * Each entry will be turned into arguments for this.setIpAddress.
     * @private
     * @param {helper} The ChildProcess object representing the helper script.
     */
    LookupService.prototype.processHelperResults = function (helper) {
        var self = this;
        return helper.run().then(function (ret) {
            var promises = [];

            ret.stdout.split('\n').forEach(function (line) {
                if (!line) {
                    return;
                }

                var items = line.split(' ');
                promises.push(this.setIpAddress(items[1], items[0]));
            }.bind(this))

            return Promise.all(promises)
        }.bind(this));
    }

    /**
     * Clean up remaining helper script promises if any are waiting on the
     * completion of a lookup script.
     * @private
     * @param {mac} The MAC address that was being updated.
     */
    LookupService.prototype.handleHelperPromises = function (mac) {
        var requests = this.macRequests[mac] || [];
        delete this.macRequests[mac];
        requests.forEach(function (responder) {
            responder.resolve();
        });
    }

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
        return this.lookupByIP(ip).then(function (record) {
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
        return this.lookupByMAC(macAddress).then(function (record) {
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
        return this.lookupByMAC(macAddress).then(function (record) {
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
        var self = this;
        var cachePromise = self.checkNodeIdCache(macAddress);

        if (cachePromise) {
            return cachePromise;
        }

        return this.lookupByMAC(macAddress)
        .then(function (record) {
            if (record.node) {
                return self.assignNodeIdCache(macAddress, record.node);
            }
            else {
                self.clearNodeIdCache(macAddress);
                throw new Errors.NotFoundError(
                    'Lookup Record Not Found (macAddressToNodeId)',
                    record
                );
            }
        })
        .catch(self.clearNodeIdCacheAndThrow.bind(self, macAddress));
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

        return this.lookupByIP(ip).then(function (record) {
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

        var self = this;
        var cachePromise = self.checkNodeIdCache(ip);
        if (cachePromise) {
            return cachePromise;
        }

        return this.lookupByIP(ip).then(function (record) {
            if (record.node) {
                return self.assignNodeIdCache(ip, record.node);
            }
            else {
                self.clearNodeIdCache(ip);
                throw new Errors.NotFoundError(
                    'Lookup Record Not Found (ipAddressToNodeId)',
                    record
                );
            }
        })
        .catch(self.clearNodeIdCacheAndThrow.bind(self, ip));
    };

    /**
     * Returns a list of IP Addresses for the given Node ID.
     * @param  {String} id Node ID
     * @return {Promise.<Array>} A promise fulfilled with an array of
     * IP Addresses associated with the Node.
     */
    LookupService.prototype.nodeIdToIpAddresses = function (id) {
        var self = this;
        assert.isMongoId(id);

        return self.validateArpCache()
        .then(function() {
            return waterline.lookups.findByTerm(id).then(function (records) {
                return _.reduce(records, function (ipAddresses, record) {
                    if (record.ipAddress) {
                        ipAddresses.push(record.ipAddress);
                    }

                    return ipAddresses;
                }, []);
            });
        });
    };

    /**
     * Returns the proxy server for the given Node ID.
     * @param  {String} id Node ID
     * @return {Promise.<String>} A promise fulfilled to the Proxy server URL
     * that corresponds to this node
     */
    LookupService.prototype.nodeIdToProxy = function (id) {
        return waterline.lookups.findOneByTerm(id).then(function (record) {
            if (record && record.proxy) {
                return record.proxy;
            } else {
                return undefined;
            }
        });
    };

    LookupService.prototype.setIpAddress = function (ip, mac) {
        return waterline.lookups.setIp(ip, mac);
    };

    LookupService.prototype.validateArpCache = function () {
        var self = this;
        return Promise.resolve().then(function() {
            if(configuration.get('arpCacheEnabled', true)) {
                return arpCache.getCurrent()
                .map(function(entry) {
                    return self.setIpAddress(entry.ip, entry.mac);
                });
            }
        });
    };

    LookupService.prototype.start = function () {
        return waterline.lookups.setIndexes();
    };

    LookupService.prototype.stop = function () {
        return Promise.resolve();
    };

    return new LookupService();
}

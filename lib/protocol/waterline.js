// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = waterlineProtocolFactory;

di.annotate(waterlineProtocolFactory, new di.Provide('Protocol.Waterline'));
di.annotate(waterlineProtocolFactory,
    new di.Inject(
        'Q',
        '_',
        'Assert',
        'WaterlineCriteria',
        'Protocol.Exchanges.Waterline',
        'Services.Messenger'
    )
);

function waterlineProtocolFactory (Q, _, assert, waterlineCriteria, waterlineExchange, messenger) {
    function WaterlineProtocol() {
        this._marshals = {};
    }

    WaterlineProtocol.QueryMarshal = QueryMarshal;
    WaterlineProtocol.CollectionCache = CollectionCache;

    WaterlineProtocol.prototype.publishRecord = function publishRecord(collection, event, record) {
        assert.object(collection);
        assert.string(collection.identity);
        assert.string(event);
        assert.object(record);

        var routingKey = collection.identity + '.' + event + '.' + record.id;
        messenger.publish(
            waterlineExchange.exchange,
            routingKey,
            {
                event: event,
                record: record
            }
        );
    };

    WaterlineProtocol.prototype.subscribeToCollection =
        function subscribeToCollection(collection, query, callback) {
        assert.object(collection);
        assert.string(collection.identity);
        assert.optionalObject(query);
        assert.func(callback);

        var self = this;
        var marshal = self._marshals[collection.identity];
        var promise;
        if (marshal) {
            promise = Q.resolve(marshal);
        } else {
            promise = messenger.subscribe(
                waterlineExchange.exchange,
                collection.identity + '.#',
                function (message) {
                    assert.object(message);
                    assert.object(message.data);
                    assert.string(message.data.event);
                    assert.object(message.data.record);

                    marshal.publish(
                        message.data.event,
                        message.data.record
                    );
                }
            ).then(function (subscription) {
                marshal = new QueryMarshal({
                    dispose: function dispose() {
                        delete self._marshals[collection.identity];
                        return subscription.dispose();
                    }
                });
                self._marshals[collection.identity] = marshal;
                return marshal;
            });
        }
        return promise.then(function (marshal) {
            return marshal.subscribe(query, callback);
        });
    };

    function QueryMarshal(subscription) {
        this._subscription = subscription;
        this._collectionCaches = new Map();
    }

    QueryMarshal.recordMatches = function recordMatches(query, record) {
        return waterlineCriteria([record], { where: query } ).results.length > 0;
    };

    QueryMarshal.prototype.publish = function publish(event, record) {
        var self = this;
        self._collectionCaches.forEach(function (cache, query) {
            cache.publish(event, record, QueryMarshal.recordMatches.bind(null, query));
        });
    };

    QueryMarshal.prototype.subscribe = function subscribe(query, callback) {
        var self = this;
        var cache;
        self._collectionCaches.forEach(function (_cache, _query) {
            if (!cache && _.isEqual(query, _query)) {
                query = _query;
                cache = _cache;
            }
        });
        if (!cache) {
            cache = new CollectionCache();
            self._collectionCaches.set(query, cache);
        }
        var subscription = cache.subscribe(callback);
        return {
            dispose: subscription.dispose.bind(subscription, function() {
                self._collectionCaches.delete(query);
                if (!self._collectionCaches.size) {
                    return self._subscription.dispose();
                }
                return Q.resolve();
            })
        };
    };

    function CollectionCache() {
        this._cache = {};
        this._callbacks = [];
    }

    CollectionCache.prototype.subscribe = function subscribe(callback) {
        var self = this;
        self._callbacks.push(callback);
        return {
            dispose: function dispose(cleanup) {
                var index = self._callbacks.indexOf(callback);
                if (index !== -1) {
                    self._callbacks.splice(index, 1);
                    if (!self._callbacks.length && _.isFunction(cleanup)) {
                        return cleanup();
                    }
                }
            }
        };
    };

    CollectionCache.prototype.publish = function publish(event, record, filterFunc) {
        var self = this;
        if (event === 'created') {
            if (filterFunc(record)) {
                self._publishCreated(record);
            }
        } else if (event === 'updated') {
            if (filterFunc(record)) {
                if (!self._isCached(record)) {
                    self._publishCreated(record);
                } else {
                    self._publishUpdated(record);
                }
            } else if (self._isCached(record)) {
                self._publishDestroyed(record);
            }
        } else if (event === 'destroyed') {
            if (self._isCached(record) && filterFunc(record)) {
                self._publishDestroyed(record);
            }
        } else {
            assert.fail('invalid event type: ' + event);
        }
    };

    CollectionCache.prototype._isCached = function isCached(record) {
        var self = this;
        return self._cache[record.id] === true;
    };

    CollectionCache.prototype._publishCreated = function publishCreated(record) {
        var self = this;
        self._cache[record.id] = true;
        self._callbacks.forEach(function (callback) {
            callback({
                event: 'created',
                record: record
            });
        });
    };

    CollectionCache.prototype._publishUpdated = function publishUpdated(record) {
        var self = this;
        self._cache[record.id] = true;
        self._callbacks.forEach(function (callback) {
            callback({
                event: 'updated',
                record: record
            });
        });
    };

    CollectionCache.prototype._publishDestroyed = function publishDestroyed(record) {
        var self = this;
        delete self._cache[record.id];
        self._callbacks.forEach(function (callback) {
            callback({
                event: 'destroyed',
                record: record
            });
        });
    };

    return new WaterlineProtocol();
}

// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di');

module.exports = WaterlineServiceFactory;

di.annotate(WaterlineServiceFactory, new di.Provide('Services.Waterline'));
di.annotate(WaterlineServiceFactory,
    new di.Inject(
        'Q',
        'Rx',
        'Services.Configuration',
        'Assert',
        'Waterline',
        'WaterlineCriteria',
        'Protocol.Waterline',
        'MongoAdapter',
        '_',
        di.Injector
    )
);

function WaterlineServiceFactory(
    Q,
    Rx,
    configuration,
    assert,
    Waterline,
    waterlineCriteria,
    waterlineProtocol,
    MongoAdapter,
    _,
    injector
) {
    function WaterlineService () {
        this.startupPriority = 1;
        this.service = new Waterline();
        this.initialized = false;
        this._subscriptions = new Map();
    }

    /**
     * Initializes waterline and loads waterline models.
     *
     * @returns {Q.promise}
     */
    WaterlineService.prototype.start = function () {
        var self = this,
            deferred = Q.defer();

        this.config = {
            adapters: {
                mongo: MongoAdapter
            },
            connections: {
                mongo: _.defaults(
                    configuration.get('mongo') || {},
                    {
                        adapter: 'mongo'
                    }
                )
            },
            defaults: {
                migrate: 'safe'
            }
        };

        assert.ok(this.config.connections.mongo, 'mongo');
        assert.ok(this.config.connections.mongo.host, 'mongo.host');
        assert.ok(this.config.connections.mongo.port, 'mongo.port');
        assert.ok(this.config.connections.mongo.database, 'mongo.database');

        // Match out Waterline.Models.* and load them into waterline.
        injector.getMatching('Models.*').forEach(function (model) {
            self.service.loadCollection(model);
        });

        // Initialize waterline and save the ontology while adding
        // convenience methods for accessing the models via the
        // collections.
        self.service.initialize(self.config, function (error, ontology) {
            if (error) {
                if (self.initialized) {
                    deferred.resolve(self);
                } else {
                    deferred.reject(error);
                }
            } else {
                _.forOwn(ontology.collections, function (collection, name) {
                    self[name] = collection;
                });

                self.initialized = true;

                deferred.resolve(self);
            }
        });

        return deferred.promise;
    };

    WaterlineService.getQueryFromDeferred = function (deferred) {
        if (_.isObject(deferred._context) && _.isObject(deferred._criteria)) {
            return deferred._criteria.where;
        }
    };

    WaterlineService.getCollectionFromDeferred = function (deferred) {
        if (!_.isObject(deferred._context)) {
            return deferred;
        }
        return deferred._context;
    };

    /**
     * Observes a waterline collection or deferred for created/updated/destroyed
     * events.
     *
     * If a deferred is passed, this will listen using the query generated from it.
     * Otherwise a "where" query can optionally be provided as the second parameter
     * to filter the collection.
     *
     * @param {(Deferred|Collection)} deferred
     * @param {Object} [query]
     * @returns {Rx.Observable}
     *
     * @example Collection
     * var subscription = waterline.observe(waterline.nodes)
     *     .subscribe(function (message) {
     *   // ...
     * });
     * subscription.dispose();
     *
     * @example Collection with query
     * var subscription = waterline.observe(waterline.nodes, { id: 123 })
     *     .subscribe(function (message) {
     *   // ...
     * });
     * subscription.dispose();
     *
     * @example Deferred
     * var subscription = waterline.observe(waterline.nodes.findOne({ id: 123 }))
     *     .subscribe(function (message) {
     *   // ...
     * });
     * subscription.dispose();
     */

    WaterlineService.prototype.observe = function (deferred, query) {
        var self = this;
        assert.object(deferred, 'deferred');

        var collection = WaterlineService.getCollectionFromDeferred(deferred);
        query = WaterlineService.getQueryFromDeferred(deferred) || query || {};

        assert.object(collection, 'collection');
        assert.string(collection.identity, 'collection.identity');

        var subscription = self._subscriptions.get(collection.identity);
        if (!subscription) {
            subscription = {
                source: waterlineProtocol.observeCollection(collection),
                queries: new Map()
            };
            assert.ok(subscription.source instanceof Rx.Observable,
                      'subscription.source instanceof Rx.Observable');
            self._subscriptions.set(collection.identity, subscription);
            subscription.source.doOnCompleted(function () {
                self._subscriptions.delete(collection.identity);
            });
        }

        var querySubscription;
        subscription.queries.forEach(function (_querySubscription, _query) {
            if (!querySubscription && _.isEqual(query, _query)) {
                querySubscription = _querySubscription;
                query = _query;
            }
        });

        if (!querySubscription) {
            querySubscription = new QuerySubscription(subscription.source, query);
            subscription.queries.set(query, querySubscription);
            querySubscription.source.doOnCompleted(function () {
                subscription.queries.delete(query);
                if (!subscription.queries.size) {
                    self._subscriptions.delete(collection.identity);
                }
            });
        }

        return querySubscription.source;
    };


    function QuerySubscription(collectionSource, query) {
        this._cache = {};

        this.source = collectionSource
            .map(this._convertMessage.bind(this, query))
            .filter(_.identity); // filter out undefined or null messages
    }

    QuerySubscription.prototype._convertMessage = function convertMessage(query, message) {
        var self = this;
        var event = message.event;
        var record = message.record;
        if (event === 'created' && queryMatches(query, record)) {
            if (!self._isCached(record)) {
                self._setCached(record, true);
                return message;
            } else {
                return castMessage(message, 'updated');
            }
        } else if (event === 'updated') {
            if (queryMatches(query, record)) {
                if (self._isCached(record)) {
                    return message;
                } else {
                    self._setCached(record, true);
                    return castMessage(message, 'created');
                }
            } else if (self._isCached(record)) {
                self._setCached(record, false);
                return castMessage(message, 'destroyed');
            }
        } else if (event === 'destroyed' &&
                   queryMatches(query, record) &&
                       self._isCached(record)) {
            return message;
        }
    };

    function queryMatches(query, record) {
        return waterlineCriteria(
            [record],
            { where: query }
        ).results.length > 0;
    }

    function castMessage(message, type) {
        return {
            event: type,
            record: message.record
        };
    }

    QuerySubscription.prototype._isCached = function isCached(record) {
        return this._cache[record.id] === true;
    };

    QuerySubscription.prototype._setCached = function setCached(record, value) {
        if (value) {
            this._cache[record.id] = true;
        } else {
            delete this._cache[record.id];
        }
    };

    /**
     * Terminates waterline services and tears down connections.
     *
     * @returns {Q.promise}
     */
    WaterlineService.prototype.stop = function () {
        return Q.ninvoke(this.service, 'teardown');
    };

    return new WaterlineService();
}

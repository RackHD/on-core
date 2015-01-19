// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di');

module.exports = WaterlineServiceFactory;

di.annotate(WaterlineServiceFactory, new di.Provide('Services.Waterline'));
di.annotate(WaterlineServiceFactory,
    new di.Inject(
        'Q',
        'Services.Configuration',
        'Assert',
        'Waterline',
        'MongoAdapter',
        '_',
        di.Injector
    )
);

function WaterlineServiceFactory(
    Q,
    configuration,
    assert,
    Waterline,
    MongoAdapter,
    _,
    injector
) {
    function WaterlineService () {
        this.startupPriority = 1;

        this.service = new Waterline();

        this.initialized = false;
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

// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di');

module.exports = WaterlineServiceFactory;

di.annotate(WaterlineServiceFactory, new di.Provide('Services.Waterline'));
di.annotate(WaterlineServiceFactory,
    new di.Inject(
        'Logger',
        'Q',
        'Services.Configuration',
        'Services.Assert',
        'Waterline',
        'MongoAdapter',
        '_',
        di.Injector
    )
);

function WaterlineServiceFactory(
    logger,
    Q,
    configuration,
    assert,
    Waterline,
    MongoAdapter,
    _,
    injector
) {
    logger = logger.initialize(WaterlineServiceFactory);

    function WaterlineService () {
        this.service = new Waterline();

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
    }

    /**
     * Initializes waterline and loads waterline models.
     *
     * @returns {Q.promise}
     */
    WaterlineService.prototype.start = function () {
        var self = this,
            deferred = Q.defer();

        assert.ok(this.config.connections.mongo);
        assert.ok(this.config.connections.mongo.host);
        assert.ok(this.config.connections.mongo.port);
        assert.ok(this.config.connections.mongo.database);

        // Match out Waterline.Models.* and load them into waterline.
        injector.getMatching('Models.*').forEach(function (model) {
            self.service.loadCollection(model);
        });

        // Initialize waterline and save the ontology while adding
        // convenience methods for accessing the models via the
        // collections.
        self.service.initialize(self.config, function (error, ontology) {
            if (error) {
                logger.emerg('Unable to initialize Waterline.', {
                    error: error
                });

                deferred.reject(error);
            } else {
                _.forOwn(ontology.collections, function (collection, name) {
                    self[name] = collection;
                });

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
        var self = this;
        return Q.ninvoke(self.service, 'teardown');
    };

    return new WaterlineService();
}
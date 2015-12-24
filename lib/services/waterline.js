// Copyright 2015, EMC, Inc.

'use strict';

module.exports = WaterlineServiceFactory;

WaterlineServiceFactory.$provide = 'Services.Waterline';
WaterlineServiceFactory.$inject = [
    'Promise',
    'Services.Configuration',
    'Assert',
    'Waterline',
    'MongoAdapter',
    '_',
    '$injector'
];

function WaterlineServiceFactory(
    Promise,
    configuration,
    assert,
    Waterline,
    MongoAdapter,
    _,
    injector
) {
    function WaterlineService () {
        this.startupPriority = 2;
        this.service = new Waterline();
        this.initialized = false;
    }

    WaterlineService.prototype.isInitialized = function () {
        return this.initialized;
    };

    /**
     * Initializes waterline and loads waterline models.
     *
     * @returns {Promise.promise}
     */
    WaterlineService.prototype.start = function () {
        var self = this;

        return new Promise(function (resolve, reject) {
            self.config = {
                adapters: {
                    mongo: MongoAdapter
                },
                connections: {
                    mongo: {
                        adapter: 'mongo',
                        url: configuration.get('mongo', 'mongodb://localhost/pxe')
                    }
                },
                defaults: {
                    migrate: configuration.get(
                        'migrate',
                        'safe'
                    )
                }
            };

            if (self.isInitialized()) {
                resolve(self);
            } else {
                // Match out Waterline.Models.* and load them into waterline.
                injector.getMatching('Models.*').forEach(function (model) {
                    self.service.loadCollection(model);
                });

                // Initialize waterline and save the ontology while adding
                // convenience methods for accessing the models via the
                // collections.
                self.service.initialize(self.config, function (error, ontology) {
                    if (error) {
                        reject(error);
                    } else {
                        _.forOwn(ontology.collections, function (collection, name) {
                            self[name] = collection;
                        });

                        self.initialized = true;

                        resolve(self);
                    }
                });
            }
        });
    };

    /**
     * Terminates waterline services and tears down connections.
     *
     * @returns {Promise.promise}
     */
    WaterlineService.prototype.stop = function () {
        var self = this;

        if (self.isInitialized()) {
            return Promise.fromNode(this.service.teardown.bind(self.service)).then(function () {
                self.initialized = false;
            });
        } else {
            return Promise.resolve();
        }
    };

    return new WaterlineService();
}

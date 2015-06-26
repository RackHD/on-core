// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = WaterlineServiceFactory;

WaterlineServiceFactory.$provide = 'Services.Waterline';
WaterlineServiceFactory.$inject = [
    'Promise',
    'Rx',
    'Services.Configuration',
    'Assert',
    'Waterline',
    'MongoAdapter',
    'DiskAdapter',
    '_',
    '$injector'
];

function WaterlineServiceFactory(
    Promise,
    Rx,
    configuration,
    assert,
    Waterline,
    MongoAdapter,
    DiskAdapter,
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
            var mongo = configuration.get('mongo');

            // TODO: Support Mongo URL syntax with the fallback to
            // the current object syntax for compatibility
            // pending a rework of the configuration file format.
            if (_.isString(mongo)) {
                mongo = {
                    adapter: 'mongo',
                    url: mongo
                };
            } else {
                mongo = _.defaults(mongo, {
                    adapter: 'mongo'
                });

                assert.ok(mongo, 'mongo');
                assert.ok(mongo.host, 'mongo.host');
                assert.ok(mongo.port, 'mongo.port');
                assert.ok(mongo.database, 'mongo.database');
            }

            self.config = {
                adapters: {
                    mongo: MongoAdapter,
                    disk: DiskAdapter
                },
                connections: {
                    mongo: mongo,
                    disk: _.defaults(
                        configuration.get('disk', {}),
                        {
                            adapter: 'disk'
                        }
                    )
                },
                defaults: {
                    migrate: 'safe'
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


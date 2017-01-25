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
    'PostgreSQLAdapter',
    '_',
    '$injector'
];

function WaterlineServiceFactory(
    Promise,
    configuration,
    assert,
    Waterline,
    MongoAdapter,
    PostgreSQLAdapter,
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

    WaterlineService.prototype.initService = function() {
        var self = this;

        return new Promise(function (resolve, reject) {
            var dbTypes = [
                configuration.get('databaseType', 'mongo'),
                configuration.get('taskgraph-store', 'mongo')
            ];
            var allowedDbTypes = ['mongo', 'postgresql'];
            assert.ok(_(_.difference(dbTypes, allowedDbTypes)).isEmpty(),
                'invalid dbType:' + _.difference(dbTypes, allowedDbTypes).toString());

            var mongoCfg = {
                adapters: {
                    mongo: MongoAdapter
                },
                connections: {
                    mongo: {
                        adapter: 'mongo',
                        url: configuration.get('mongo', 'mongodb://localhost/pxe')
                    }
                }
            };

            var postgreSqlCfg = {
                adapters: {
                    postgresql: PostgreSQLAdapter
                },
                connections: {
                    postgresql: {
                        adapter: 'postgresql',
                        module: 'postgresql',
                        url: configuration.get('postgresql',
                                'postgres://rackhd:rackhd@localhost:5432/pxe'),
                        poolSize: 10,
                        ssl: false
                    }
                }
            };

            var config = _.merge({},
                (-1 !== _.indexOf(dbTypes, 'mongo')) ? mongoCfg : {},
                (-1 !== _.indexOf(dbTypes, 'postgresql')) ? postgreSqlCfg : {},
                {
                    defaults: {
                        migrate: configuration.get('migrate', 'safe')
                    }
                });

            // Match out Waterline.Models.* and load them into waterline.
            injector.getMatching('Models.*').forEach(function (model) {
                self.service.loadCollection(model);
            });

            // Initialize waterline and save the ontology while adding
            // convenience methods for accessing the models via the
            // collections.
            self.service.initialize(config, function (error, ontology) {
                if (error) {
                    reject(error);
                } else {
                    _.forOwn(ontology.collections, function (collection, name) {
                        self[name] = collection;
                    });
                    self.ontology = ontology;
                    resolve(self);
                }
            });
        });
    };

    /**
     * Initializes waterline and loads waterline models.
     *
     * @returns {Promise.promise}
     */
    WaterlineService.prototype.start = function () {
        var self = this;

        return Promise.resolve().then(function() {
            if (!self.isInitialized()) {
                return self.initService().then(function() {
                    self.initialized = true;
                });
            }
        })
        .then(function() {
            //it's OK to create indexes multiple times, so the code isn't protected by initialized
            //checking.
            return Promise.map(_.values(self.ontology.collections), function (collection) {
                return collection.createIndexes();
            });
        })
        .then(function() {
            return self;
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

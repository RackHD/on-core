// Copyright 2016, EMC, Inc.

'use strict';

module.exports = environmentServiceFactory;

environmentServiceFactory.$provide = 'Services.Environment';
environmentServiceFactory.$inject = [
    'Promise',
    'Services.Waterline',
    '_',
    'Assert'
];

function environmentServiceFactory(
    Promise,
    waterline,
    _,
    assert
) {
    function EnvironmentService() {
    }

    /**
     * Set the 'key' to the 'value' in the document identified by 'identifier'
     * @param  {String}     key
     * @param  {Object}     value
     * @param  {String}   identifier
     */
    EnvironmentService.prototype.set = function set(key, value, identifier) {
        identifier = identifier || 'global';
        return waterline.environment.findOrCreate(
            {identifier: identifier}, 
            {identifier: identifier, data: {}}
        ).then(function(env) {
            _.set(env.data, key, value);
            return waterline.environment.update({identifier: identifier}, {data: env.data});
        });
    };

    /**
     * Retrieve the 'key' using the hierarchy specified in identifiers.
     * The defaults value is returned if the key does not exist
     * @param  {String}     key
     * @param  {Object}     defaults
     * @param  {Array}   identifiers
     */
    EnvironmentService.prototype.get = function get(key, defaults, identifiers) {
        return this.getAll(identifiers).then(function(envs) {
            return _.get(envs, key, defaults);
        });
    };

    /**
     * Retrieve the documents specified by identifiers and merge in order of priority
     * @param  {Array}   identifiers
     */
    EnvironmentService.prototype.getAll = function (identifiers) {
        identifiers = identifiers || ['global'];
        assert.arrayOfString(identifiers, 'identifiers should be an array');
        return Promise.all(Promise.map( identifiers, function(identifier) {
            return waterline.environment.findOne({identifier: identifier});
        }).filter(function(env) {
            return env;
        })).then(function(envs) {
            var data = _.sortBy(envs, function(env) {
                return (envs.length - identifiers.indexOf(env.identifier));
            });
            var data2 = _.merge.apply(_, _.flatten([{}, data]));
            return data2.data;
        });
    };

    EnvironmentService.prototype.start = function start() {
        return Promise.resolve();
    };

    EnvironmentService.prototype.stop = function stop() {
        return Promise.resolve();
    };

    return new EnvironmentService();
}

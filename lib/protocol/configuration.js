// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = configurationProtocolFactory;

di.annotate(configurationProtocolFactory, new di.Provide('Protocol.Configuration'));
di.annotate(configurationProtocolFactory,
    new di.Inject(
        'Constants',
        'Services.Messenger',
        'Assert',
        'Q',
        'Result'
    )
);

function configurationProtocolFactory (Constants, messenger, assert, Q, Result) {
    function ConfigurationProtocol() {
    }

    /**
     * Subscribe to configuration setting changes
     *
     * @param callback {function} callback taking an object with two properties
     *                            key {string} and value {string|Object}
     *                            and returns a concrete result
     * @returns {Q.Promise}
     */
    ConfigurationProtocol.prototype.subscribeSet = function subscribeSet(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Configuration.Name,
            'methods.set',
            function(data, message) {
                Q.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
            }
        );
    };

    /**
     * publish a request to set a configuration value
     *
     * @param data {Object} data object with a property "key" {string} and
     *                      value {string|Object} to set as configuration.
     * @returns {Q.Promise}
     */
    ConfigurationProtocol.prototype.publishSet = function publishSet(data) {
        assert.object(data);
        //TODO(heckj) add asserts to verify data has a key and value property...

        return messenger.publish(
            Constants.Protocol.Exchanges.Configuration.Name,
            'methods.set',
            new Result({ value: data })
        );
    };

    /**
     * Subscribe to requests for configuration values
     *
     * @param callback {function} callback taking an object with two properties
     *                            key {string} and value {string|Object}
     *                            and returns a concrete result
     * @returns {Q.Promise}
     */
    ConfigurationProtocol.prototype.subscribeGet = function subscribeSet(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Configuration.Name,
            'methods.get',
            function(data, message) {
                Q.resolve().then(function () {
                    return callback(data.value);
                }).then(function (result) {
                    message.resolve(
                        new Result({value: result})
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
            }
        );
    };

    /**
     * publish a request to get a configuration value
     *
     * @param data {Object} data object with a property "key" {string} and
     *                      value {string|Object} to set as configuration.
     * @returns {Q.Promise}
     */
    ConfigurationProtocol.prototype.publishGet = function publishGet(data) {
        assert.object(data);
        //TODO(heckj) add asserts to verify data has a property "key" that is a string

        // NOTE(heckj): thinking this should be messenger.request instead of
        // messenger.publish, but leaving in place as it is (unused) for now
        return messenger.publish(
            Constants.Protocol.Exchanges.Configuration.Name,
            'methods.get',
            new Result({ value: data })
        );
    };

    return new ConfigurationProtocol();
}

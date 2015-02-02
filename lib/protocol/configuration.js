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
        'Assert'
    )
);

function configurationProtocolFactory (Constants, messenger, assert) {
    function ConfigurationProtocol() {
    }

    ConfigurationProtocol.prototype.subscribeSet = function subscribeSet(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Configuration.Name,
            'methods.set',
            function(data) {
                callback(data.key, data.value);
            }
        );
    };

    ConfigurationProtocol.prototype.subscribeGet = function subscribeSet(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Configuration.Name,
            'methods.get',
            function(data, message) {
                message.promise(
                    callback(data.key)
                );
            }
        );
    };

    return new ConfigurationProtocol();
}

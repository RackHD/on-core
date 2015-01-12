// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = configurationProtocolFactory;

di.annotate(configurationProtocolFactory, new di.Provide('Protocol.Configuration'));
di.annotate(configurationProtocolFactory,
    new di.Inject(
        'Protocol.Exchanges.Configuration',
        'Services.Messenger',
        'Assert'
    )
);
function configurationProtocolFactory (configurationExchange, messenger, assert) {
    function ConfigurationProtocol() {
    }

    ConfigurationProtocol.prototype.subscribeSet = function subscribeSet(callback) {
        return messenger.subscribe(configurationExchange.exchange, 'methods.set',
                function(message) {
            var _callback = callback;
            assert.ok(message.key);
            assert.ok(message.value);
            _callback(message.key, message.value);
        });
    };

    ConfigurationProtocol.prototype.subscribeGet = function subscribeSet(callback) {
        return messenger.subscribe(configurationExchange.exchange, 'methods.get',
                function(message) {
            var _callback = callback;
            assert.ok(message.key);
            var result = _callback(message.key);
            message.respond({ result: result });
        });
    };

    return new ConfigurationProtocol();
}

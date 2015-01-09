// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = configurationProtocolFactory;

di.annotate(configurationProtocolFactory, new di.Provide('Protocol.Configuration'));
di.annotate(configurationProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Services.Assert'
    )
);
function configurationProtocolFactory (messenger, assert) {
    function ConfigurationProtocol() {
        this.exchange = 'configuration';
    }

    ConfigurationProtocol.prototype.subscribeSet = function subscribeSet(callback) {
        return messenger.subscribe(this.exchange, 'methods.set', function(message) {
            var _callback = callback;
            assert.ok(message.key);
            assert.ok(message.value);
            _callback(message.key, message.value);
        });
    };

    ConfigurationProtocol.prototype.subscribeGet = function subscribeSet(callback) {
        return messenger.subscribe(this.exchange, 'methods.get', function(message) {
            var _callback = callback;
            assert.ok(message.key);
            var result = _callback(message.key);
            message.respond({ result: result });
        });
    };

    ConfigurationProtocol.prototype.start = function start() {
        return messenger.exchange(this.exchange, 'topic', {
            durable: true
        });
    };

    return new ConfigurationProtocol();
}

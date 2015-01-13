// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = exchangeFactory;

di.annotate(exchangeFactory, new di.Provide('Protocol.Exchanges.Base'));
di.annotate(exchangeFactory,
    new di.Inject(
        'Services.Messenger',
        'Assert',
        'Q'
    )
);

function exchangeFactory (messenger, assert, Q) {
    function Exchange (exchange, type, options) {
        this.exchange = exchange;
        this.type = type || 'topic';
        this.options = options || {
            durable: true
        };
    }

    Exchange.prototype.start = function start () {
        assert.ok(messenger.connection);
        assert.ok(this.exchange);
        assert.ok(this.type);
        assert.ok(this.options);
        return messenger.exchange(this.exchange, this.type, this.options);
    };

    Exchange.prototype.stop = function stop () {
        return Q.resolve();
    };

    Exchange.create = function create(exchange) {
        return new Exchange(exchange);
    };

    return Exchange;
}

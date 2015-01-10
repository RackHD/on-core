// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = httpProtocolFactory;

di.annotate(httpProtocolFactory, new di.Provide('Protocol.Http'));
di.annotate(httpProtocolFactory,
    new di.Inject(
        'Services.Messenger'
    )
);

function httpProtocolFactory (messenger) {
    function HttpProtocol() {
        this.exchange = 'http';
    }

    HttpProtocol.prototype.publishResponse = function publishResponse(data) {
        messenger.publish(this.exchange, 'http.response', data);
    };

    HttpProtocol.prototype.start = function start() {
         return messenger.exchange(this.exchange, 'topic', {
            durable: true
        });
    };

    return new HttpProtocol();
}

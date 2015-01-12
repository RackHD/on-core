// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = httpProtocolFactory;

di.annotate(httpProtocolFactory, new di.Provide('Protocol.Http'));
di.annotate(httpProtocolFactory,
    new di.Inject(
        'Protocol.Exchanges.Http',
        'Services.Messenger'
    )
);

function httpProtocolFactory (httpExchange, messenger) {
    function HttpProtocol() {
    }

    HttpProtocol.prototype.publishResponse = function publishResponse(data) {
        messenger.publish(httpExchange.exchange, 'http.response', data);
    };

    return new HttpProtocol();
}

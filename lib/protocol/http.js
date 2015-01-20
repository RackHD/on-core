// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = httpProtocolFactory;

di.annotate(httpProtocolFactory, new di.Provide('Protocol.Http'));
di.annotate(httpProtocolFactory,
    new di.Inject(
        'Assert',
        'Constants',
        'Services.Messenger'
    )
);

function httpProtocolFactory (assert, Constants, messenger) {
    function HttpProtocol() {
    }

    HttpProtocol.prototype.publishResponse = function (data) {
        assert.object(data);

        messenger.publish(
            Constants.Protocol.Exchanges.Http.Name,
            'http.response',
            data
        );
    };

    return new HttpProtocol();
}

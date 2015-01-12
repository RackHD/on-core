// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = httpExchangeFactory;

di.annotate(httpExchangeFactory, new di.Provide('Protocol.Exchanges.Http'));
di.annotate(httpExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function httpExchangeFactory (Exchange) {
    return Exchange.create('http');
}

// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = loggingExchangeFactory;

di.annotate(loggingExchangeFactory, new di.Provide('Protocol.Exchanges.Logging'));
di.annotate(loggingExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function loggingExchangeFactory (Exchange) {
    return Exchange.create('logging');
}

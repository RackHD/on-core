// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = waterlineExchangeFactory;

di.annotate(waterlineExchangeFactory, new di.Provide('Protocol.Exchanges.Waterline'));
di.annotate(waterlineExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function waterlineExchangeFactory (Exchange) {
    return Exchange.create('waterline');
}

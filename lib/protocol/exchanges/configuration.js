// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = configurationExchangeFactory;

di.annotate(configurationExchangeFactory, new di.Provide('Protocol.Exchanges.Configuration'));
di.annotate(configurationExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function configurationExchangeFactory (Exchange) {
    return Exchange.create('configuration');
}

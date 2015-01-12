// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = schedulerExchangeFactory;

di.annotate(schedulerExchangeFactory, new di.Provide('Protocol.Exchanges.Scheduler'));
di.annotate(schedulerExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function schedulerExchangeFactory (Exchange) {
    return Exchange.create('scheduler');
}

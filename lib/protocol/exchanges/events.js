// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = eventsExchangeFactory;

di.annotate(eventsExchangeFactory, new di.Provide('Protocol.Exchanges.Events'));
di.annotate(eventsExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function eventsExchangeFactory (Exchange) {
    return Exchange.create('events');
}

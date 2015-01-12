// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = dhcpExchangeFactory;

di.annotate(dhcpExchangeFactory, new di.Provide('Protocol.Exchanges.Dhcp'));
di.annotate(dhcpExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function dhcpExchangeFactory (Exchange) {
    return Exchange.create('dhcp');
}

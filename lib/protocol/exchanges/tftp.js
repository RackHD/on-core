// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = tftpExchangeFactory;

di.annotate(tftpExchangeFactory, new di.Provide('Protocol.Exchanges.Tftp'));
di.annotate(tftpExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function tftpExchangeFactory (Exchange) {
    return Exchange.create('tftp');
}

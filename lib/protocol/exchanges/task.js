// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskExchangeFactory;

di.annotate(taskExchangeFactory, new di.Provide('Protocol.Exchanges.Task'));
di.annotate(taskExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function taskExchangeFactory (Exchange) {
    return Exchange.create('task');
}

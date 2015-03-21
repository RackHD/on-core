// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di'); var util = require('util');

module.exports = messengerServiceFactory;

di.annotate(messengerServiceFactory, new di.Provide('Services.Messenger'));
di.annotate(messengerServiceFactory, new di.Inject('Messenger'));

function messengerServiceFactory(Messenger) {
    return new Messenger();
}

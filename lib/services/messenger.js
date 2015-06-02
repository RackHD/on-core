// Copyright (c) 2015, EMC Corporation


'use strict';

var di = require('di');

module.exports = messengerServiceFactory;

di.annotate(messengerServiceFactory, new di.Provide('Services.Messenger'));
di.annotate(messengerServiceFactory, new di.Inject('Messenger'));

function messengerServiceFactory(Messenger) {
    return new Messenger();
}

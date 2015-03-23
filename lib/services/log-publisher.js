// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = logPublisherFactory;

di.annotate(logPublisherFactory, new di.Provide('Services.LogPublisher'));
di.annotate(logPublisherFactory, new di.Inject('Messenger'));

function logPublisherFactory(Messenger) {
    return new Messenger();
}

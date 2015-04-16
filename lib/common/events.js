// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = eventsFactory;

di.annotate(eventsFactory, new di.Provide('Events'));
di.annotate(eventsFactory,
    new di.Inject(
        'EventEmitter'
    )
);

function eventsFactory(EventEmitter) {
    return new EventEmitter();
}


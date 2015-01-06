// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = schedulerProtocolFactory;

di.annotate(schedulerProtocolFactory, new di.Provide('Protocol.Scheduler'));
di.annotate(schedulerProtocolFactory,
    new di.Inject(
    )
);

function schedulerProtocolFactory () {
    return {};
}
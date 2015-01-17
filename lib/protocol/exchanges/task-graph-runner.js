// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskGraphRunnerExchangeFactory;

di.annotate(taskGraphRunnerExchangeFactory, new di.Provide('Protocol.Exchanges.TaskGraphRunner'));
di.annotate(taskGraphRunnerExchangeFactory,
    new di.Inject(
        'Protocol.Exchanges.Base'
    )
);

function taskGraphRunnerExchangeFactory (Exchange) {
    return Exchange.create('task-graph-runner');
}

// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = schedulerProtocolFactory;

di.annotate(schedulerProtocolFactory, new di.Provide('Protocol.Scheduler'));
di.annotate(schedulerProtocolFactory,
    new di.Inject(
        'Services.Messenger'
    )
);

function schedulerProtocolFactory (messenger) {
    function SchedulerProtocol() {
        this.exchange = 'scheduler';
    }

    SchedulerProtocol.prototype.start = function start() {
        return messenger.exchange(this.exchange, 'topic', {
            durable: true
        });
    };

    return new SchedulerProtocol();
}

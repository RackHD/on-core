// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = loggingProtocolFactory;

di.annotate(loggingProtocolFactory, new di.Provide('Protocol.Logging'));
di.annotate(loggingProtocolFactory,
    new di.Inject(
        'Services.Messenger'
    )
);

function loggingProtocolFactory (messenger) {
    function LoggingProtocol() {
        this.exchange = 'logging';
    }

    LoggingProtocol.prototype.publishLog = function publishLog(level, data) {
        messenger.publish(this.exchange, level, data);
    };

    return new LoggingProtocol(messenger);
}


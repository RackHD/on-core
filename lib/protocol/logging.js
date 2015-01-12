// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = loggingProtocolFactory;

di.annotate(loggingProtocolFactory, new di.Provide('Protocol.Logging'));
di.annotate(loggingProtocolFactory,
    new di.Inject(
        'Protocol.Exchanges.Logging',
        'Services.Messenger'
    )
);

function loggingProtocolFactory (loggingExchange, messenger) {
    function LoggingProtocol() {
    }

    LoggingProtocol.prototype.publishLog = function publishLog(level, data) {
        messenger.publish(loggingExchange.exchange, level, data);
    };

    return new LoggingProtocol();
}


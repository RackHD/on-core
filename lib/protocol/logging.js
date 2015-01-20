// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = loggingProtocolFactory;

di.annotate(loggingProtocolFactory, new di.Provide('Protocol.Logging'));
di.annotate(loggingProtocolFactory,
    new di.Inject(
        'Assert',
        'Constants',
        'Services.Messenger',
        '_'
    )
);

function loggingProtocolFactory (assert, Constants, messenger, _) {
    var levels = _.keys(Constants.Logging.Levels);

    function LoggingProtocol() {
    }

    LoggingProtocol.prototype.publishLog = function (level, data) {
        assert.isIn('level', levels);
        assert.object(data, 'data');

        messenger.publish(
            Constants.Protocol.Exchanges.Logging.Name,
            level,
            data
        );
    };

    return new LoggingProtocol();
}

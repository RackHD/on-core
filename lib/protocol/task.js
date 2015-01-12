// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskProtocolFactory;

di.annotate(taskProtocolFactory, new di.Provide('Protocol.Task'));
di.annotate(taskProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Protocol.Exchanges.Task'
    )
);

function taskProtocolFactory (messenger, taskExchange) {
    function TaskProtocol() {
    }

    TaskProtocol.prototype.getBootFile = function getBootFile(nodeId, options) {
        return messenger.request(
                taskExchange.exchange,
                'methods.getBootFile' + '.' + nodeId,
                options
            )
            .then(function(message) {
                return message.data.result;
            });
    };

    TaskProtocol.prototype.activeTaskExists = function activeTaskExists(identifier) {
        return messenger.request(
                taskExchange.exchange,
                'methods.activeTaskExists' + '.' + identifier,
                identifier
            )
            .then(function(message) {
                return message.data.result;
            });
    };

    return new TaskProtocol();
}

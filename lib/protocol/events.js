// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = eventsProtocolFactory;

di.annotate(eventsProtocolFactory, new di.Provide('Protocol.Events'));
di.annotate(eventsProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Services.Assert',
        'Q'
    )
);

function eventsProtocolFactory (messenger, assert, Q) {

    function EventsProtocol () {
        this.exchange = 'events';
    }

    EventsProtocol.prototype.publishTftpSuccess = function (nodeId, data) {
        assert.ok(nodeId);

        messenger.publish(this.exchange, 'tftp.success' + '.' + nodeId, data);
    };

    EventsProtocol.prototype.publishTftpFailure = function (nodeId, data) {
        assert.ok(nodeId);

        messenger.publish(this.exchange, 'tftp.failure' + '.' + nodeId, data);
    };

    EventsProtocol.prototype.publishHttpResponse = function (nodeId, data) {
        assert.ok(nodeId);

        messenger.publish(this.exchange, 'http.response' + '.' + nodeId, data);
    };

    EventsProtocol.prototype.start = function start(){
        return messenger.exchange(this.exchange, 'topic', {
            durable: true
        });
    };

    EventsProtocol.prototype.stop = function stop(){
        return Q.resolve();
    };

    return new EventsProtocol();
}

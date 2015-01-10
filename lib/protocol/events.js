// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = eventsProtocolFactory;

di.annotate(eventsProtocolFactory, new di.Provide('Protocol.Events'));
di.annotate(eventsProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Assert',
        'Q',
        '_',
        'Tracer'
    )
);

function eventsProtocolFactory (messenger, assert, Q, _, tracer) {

    function EventsProtocol () {
        this.exchange = 'events';
    }

    EventsProtocol.prototype.publishTftpSuccess = function (nodeId, data) {
        assert.ok(nodeId);
        assert.object(data);

        messenger.publish(
            this.exchange,
            'tftp.success' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.publishTftpFailure = function (nodeId, data) {
        assert.ok(nodeId);
        assert.object(data);

        messenger.publish(
            this.exchange,
            'tftp.failure' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.publishHttpResponse = function (nodeId, data) {
        assert.ok(nodeId);
        assert.object(data);

        messenger.publish(
            this.exchange,
            'http.response' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.start = function start () {
        assert.ok(this.exchange);

        return messenger.exchange(this.exchange, 'topic', {
            durable: true
        });
    };

    EventsProtocol.prototype.stop = function stop () {
        return Q.resolve();
    };

    return new EventsProtocol();
}

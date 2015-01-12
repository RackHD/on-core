// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = eventsProtocolFactory;

di.annotate(eventsProtocolFactory, new di.Provide('Protocol.Events'));
di.annotate(eventsProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Protocol.Exchanges.Events',
        'Assert'
    )
);

function eventsProtocolFactory (messenger, eventsExchange, assert) {
    function EventsProtocol () {
    }

    EventsProtocol.prototype.publishTftpSuccess = function (nodeId, data) {
        assert.ok(nodeId);
        assert.object(data);

        messenger.publish(
            eventsExchange.exchange,
            'tftp.success' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.publishTftpFailure = function (nodeId, data) {
        assert.ok(nodeId);
        assert.object(data);

        messenger.publish(
            eventsExchange.exchange,
            'tftp.failure' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.publishHttpResponse = function (nodeId, data) {
        assert.ok(nodeId);
        assert.object(data);

        messenger.publish(
            eventsExchange.exchange,
            'http.response' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.publishDhcpBoundLease = function(nodeId, data) {
        assert.ok(nodeId);
        assert.ok(data);

        messenger.publish(
            eventsExchange.exchange,
            'dhcp.bind.success' + '.' + nodeId,
            data
        );
    };

    return new EventsProtocol();
}

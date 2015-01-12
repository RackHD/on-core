// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = eventsProtocolFactory;

di.annotate(eventsProtocolFactory, new di.Provide('Protocol.Events'));
di.annotate(eventsProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Assert'
    )
);

function eventsProtocolFactory (messenger, assert) {
    function EventsProtocol () {
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

    return new EventsProtocol();
}

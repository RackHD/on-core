// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = eventsProtocolFactory;

di.annotate(eventsProtocolFactory, new di.Provide('Protocol.Events'));
di.annotate(eventsProtocolFactory,
    new di.Inject(
        'Constants',
        'Services.Messenger',
        'Assert'
    )
);

function eventsProtocolFactory (Constants, messenger, assert) {
    function EventsProtocol () {
    }

    EventsProtocol.prototype.publishTftpSuccess = function (nodeId, data) {
        assert.string(nodeId);
        assert.object(data);

        messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'tftp.success' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.publishTftpFailure = function (nodeId, data) {
        assert.string(nodeId);
        assert.object(data);

        messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'tftp.failure' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.publishHttpResponse = function (nodeId, data) {
        assert.string(nodeId);
        assert.object(data);

        messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'http.response' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.subscribeTftpSuccess = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback);

        return messenger.subscribe(
                Constants.Protocol.Exchanges.Events.Name,
                'tftp.success' + '.' + nodeId,
                function(message) {
                    callback(message.data, message);
                }
        );
    };

    EventsProtocol.prototype.subscribeHttpResponse = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback);

        return messenger.subscribe(
                Constants.Protocol.Exchanges.Events.Name,
                'http.response' + '.' + nodeId,
                function(message) {
                    callback(message.data, message);
                }
        );
    };

    EventsProtocol.prototype.publishDhcpBoundLease = function (nodeId, data) {
        assert.string(nodeId);
        assert.object(data);

        messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'dhcp.bind.success' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.subscribeDhcpBoundLease = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback);

        return messenger.subscribe(
                Constants.Protocol.Exchanges.Events.Name,
                'dhcp.bind.success' + '.' + nodeId,
                function(message) {
                    callback(message.data, message);
                }
        );
    };

    EventsProtocol.prototype.publishTaskFinished = function (taskId, data) {
        assert.uuid(taskId);

        messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'task.finished' + '.' + taskId,
            data || {}
        );
    };

    EventsProtocol.prototype.subscribeTaskFinished = function (taskId, callback) {
        assert.uuid(taskId);
        assert.func(callback);

        return messenger.subscribe(
                Constants.Protocol.Exchanges.Events.Name,
                'task.finished' + '.' + taskId,
                function() {
                    var _callback = callback;
                    _callback();
                }
        );
    };

    return new EventsProtocol();
}

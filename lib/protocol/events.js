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

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'tftp.success' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.subscribeTftpSuccess = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'tftp.success' + '.' + nodeId,
            callback
        );
    };

    EventsProtocol.prototype.publishTftpFailure = function (nodeId, data) {
        assert.string(nodeId);
        assert.object(data);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'tftp.failure' + '.' + nodeId,
            data
        );
    };

    EventsProtocol.prototype.subscribeTftpFailure = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'tftp.failure' + '.' + nodeId,
            callback
        );
    };

    EventsProtocol.prototype.publishHttpResponse = function (nodeId, data) {
        assert.string(nodeId);
        assert.object(data);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'http.response' + '.' + nodeId,
            data
        );
    };


    EventsProtocol.prototype.subscribeHttpResponse = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'http.response' + '.' + nodeId,
            callback
        );
    };

    EventsProtocol.prototype.publishDhcpBoundLease = function (nodeId, data) {
        assert.string(nodeId);
        assert.object(data);

        return messenger.publish(
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
            callback
        );
    };

    EventsProtocol.prototype.publishTaskFinished = function (taskId, data) {
        assert.uuid(taskId);

        return messenger.publish(
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
            callback
        );
    };

    EventsProtocol.prototype.publishGraphStarted = function (graphid, data) {
        assert.uuid(graphid);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'graph.started' + '.' + graphid,
            data || {}
        );
    };

    EventsProtocol.prototype.subscribeGraphStarted = function (graphid, callback) {
        assert.uuid(graphid);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'graph.started' + '.' + graphid,
            function(data) {
                callback(data);
            }
        );
    };

    EventsProtocol.prototype.publishGraphFinished = function (graphid, status) {
        assert.uuid(graphid);
        assert.string(status);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'graph.finished' + '.' + graphid,
            { status: status }
        );
    };

    EventsProtocol.prototype.subscribeGraphFinished = function (graphid, callback) {
        assert.uuid(graphid);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'graph.finished' + '.' + graphid,
            function(data) {
                callback(data.status);
            }
        );
    };

    return new EventsProtocol();
}

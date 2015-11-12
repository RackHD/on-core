// Copyright 2015, EMC, Inc.

'use strict';

module.exports = eventsProtocolFactory;

eventsProtocolFactory.$provide = 'Protocol.Events';
eventsProtocolFactory.$inject = [
    'Constants',
    'Services.Messenger',
    'Assert'
];

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

    EventsProtocol.prototype.publishTaskFinished = function (domain, taskId, graphId, state) {
        assert.string(domain);
        assert.string(taskId);
        assert.string(graphId);
        assert.string(state);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            domain + '.' + 'task.finished',
            { taskId: taskId, graphId: graphId, state: state }
        );
    };

    EventsProtocol.prototype.subscribeTaskFinished = function (domain, callback) {
        assert.string(domain);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            domain + '.' + 'task.finished',
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

    EventsProtocol.prototype.publishSkuAssigned = function (nodeId, skuId) {
        assert.isMongoId(nodeId);
        assert.isMongoId(skuId);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'sku.assigned' + '.' + nodeId,
            { sku: skuId }
        );
    };

    EventsProtocol.prototype.subscribeSkuAssigned = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'sku.assigned' + '.' + nodeId,
            function(data) {
                callback(data.sku);
            }
        );
    };

    EventsProtocol.prototype.publishIgnoredError = function (error) {
        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            Constants.Events.Ignored,
            error
        );
    };

    EventsProtocol.prototype.publishUnhandledError = function (error) {
        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            Constants.Events.Unhandled,
            error
        );
    };

    EventsProtocol.prototype.publishBlockedEventLoop = function (e) {
        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            Constants.Events.Blocked,
            e
        );
    };

    return new EventsProtocol();
}


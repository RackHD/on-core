// Copyright 2015, EMC, Inc.

'use strict';

module.exports = eventsProtocolFactory;

eventsProtocolFactory.$provide = 'Protocol.Events';
eventsProtocolFactory.$inject = [
    'Constants',
    '_',
    'Services.Messenger',
    'Promise',
    'Assert'
];

function eventsProtocolFactory (
    Constants,
    _,
    messenger,
    Promise,
    assert
) {
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

    EventsProtocol.prototype.publishTaskFinished = function (
            domain, taskId, graphId, state, error, context, terminalOnStates) {
        assert.string(domain);
        assert.string(taskId);
        assert.uuid(graphId);
        assert.string(state);
        assert.object(context);
        assert.arrayOfString(terminalOnStates);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            domain + '.' + 'task.finished',
            { taskId: taskId, graphId: graphId, state: state, error: error,
                context: context, terminalOnStates: terminalOnStates }
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
        assert.uuid(skuId);

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

    EventsProtocol.prototype.publishEvent = function (data) {
        assert.object(data);
        assert.string(data.type);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'event' + '.' + data.type,
            data || {}
        );
    };

    /* TODO: If event payload need more info, please add 3th argument */
    EventsProtocol.prototype.publishNodeEvent = function (node, action) {
        var self = this;
        assert.object(node);
        assert.string(action);

        var nodeEvent = {
            type: 'node',
            action: action,
            nodeId: node.id,
            nodeType: node.type
        };

        return self.publishEvent(nodeEvent);
    };

    EventsProtocol.prototype.publishNodeAttrEvent = function (oldNode, newNode, attr) {
        var self = this;
        var attrAction = self._getAttrAction(oldNode, newNode, attr);

        if (attrAction) {
            return self.publishNodeEvent(newNode, attr + '.' + attrAction);
        }

        return Promise.resolve();
    };

    EventsProtocol.prototype._getAttrAction = function (oldRecord, newRecord, attr) {
        if (oldRecord && newRecord && oldRecord.id === newRecord.id) {
            if (!_.isEmpty(oldRecord[attr]) && !_.isEmpty(newRecord[attr]) &&
                    oldRecord[attr] !== newRecord[attr]) {
                return 'updated';
            } else if (!_.isEmpty(oldRecord[attr]) && _.isEmpty(newRecord[attr])) {
                return 'unassigned';
            } else if (_.isEmpty(oldRecord[attr]) && !_.isEmpty(newRecord[attr])) {
                return 'assigned';
            }
        }
    };

    return new EventsProtocol();
}

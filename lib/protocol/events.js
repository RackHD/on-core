// Copyright 2015, EMC, Inc.

'use strict';

module.exports = eventsProtocolFactory;

eventsProtocolFactory.$provide = 'Protocol.Events';
eventsProtocolFactory.$inject = [
    'Constants',
    '_',
    'Services.Messenger',
    'Services.Hook',
    'Promise',
    'validator',
    'Result',
    'Assert'
];

function eventsProtocolFactory (
    Constants,
    _,
    messenger,
    hook,
    Promise,
    validator,
    Result,
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

    EventsProtocol.prototype.publishHttpResponseUuid = function (id, data) {
        assert.string(id);
        assert.object(data);
        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'http.response' + '.' + id,
            data
        );
    };
    
    EventsProtocol.prototype.subscribeHttpResponseUuid = function (id, callback) {
        assert.uuid(id);
        assert.func(callback);
        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'http.response' + '.' + id,
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
            domain, taskId, taskName, graphId, graphName, state, error, context, terminalOnStates) {
        assert.string(domain);
        assert.string(taskId);
        assert.string(taskName);
        assert.uuid(graphId);
        assert.string(graphName);
        assert.string(state);
        assert.object(context);
        assert.arrayOfString(terminalOnStates);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            domain + '.' + 'task.finished',
            { taskId: taskId, taskName:taskName, graphId: graphId, graphName: graphName, state: state, error: error,
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

    EventsProtocol.prototype.publishNodeNotification = function (nodeId, data) {
        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'notification' + '.' + nodeId,
            data || ''
        );
    };

    EventsProtocol.prototype.subscribeNodeNotification = function (nodeId, callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'notification' + '.' + nodeId,
            callback
        );
    };

    EventsProtocol.prototype.publishBroadcastNotification = function (data) {
        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'notification',
            data || ''
        );
    };
    EventsProtocol.prototype.subscribeBroadcastNotification = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'notification',
            callback
        );
    };


    EventsProtocol.prototype.publishGraphStarted = function (graphid, data, nodeId) {
        var self = this;
        assert.uuid(graphid);
        assert.object(data);
        assert.uuid(data.graphId);
        assert.string(data.graphName);
        assert.string(data.status);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'graph.started' + '.' + graphid,
            data
        ).then(function () {
            return self.publishGraphEvent(graphid, 'started', nodeId, data);
        });
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

    EventsProtocol.prototype.publishGraphFinished = function (graphid, data, nodeId) {
        var self = this;
        assert.uuid(graphid);
        assert.object(data);
        assert.uuid(data.graphId);
        assert.string(data.graphName);
        assert.string(data.status);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'graph.finished' + '.' + graphid,
            data
        ).then(function () {
            return self.publishGraphEvent(graphid, 'finished', nodeId, data);
        });
    };

    EventsProtocol.prototype.subscribeGraphFinished = function (graphid, callback) {
        assert.uuid(graphid);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'graph.finished' + '.' + graphid,
            function(data) {
                callback(data);
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

    EventsProtocol.prototype.publishExternalEvent = function (eventData) {
        assert.object(eventData, 'eventData');
        assert.string(eventData.type, 'eventData.type');
        assert.string(eventData.action, 'eventData.action');
        assert.string(eventData.severity, 'eventData.severity');
        assert.string(eventData.typeId, 'eventData.typeId');
        assert.ok(eventData.hasOwnProperty('data'));

        var routingKey = eventData.type + '.' + eventData.action +
                         '.' + eventData.severity + '.' + eventData.typeId;

        if (eventData.nodeId){
            routingKey = routingKey + '.' + eventData.nodeId;
        }

        eventData.version = '1.0';
        eventData.createdAt = new Date();

        return Promise.all([
            messenger.publish(
                Constants.Protocol.Exchanges.Events.Name,
                routingKey,
                eventData
            ),
            hook.publish(eventData)
        ]);
    };

    EventsProtocol.prototype.publishHeartbeatEvent = function (eventTypeId, data){
        var self = this;
        assert.string(eventTypeId, 'eventTypeId');
        assert.object(data, 'data');

        var heartbeatEvent = {
            type: 'heartbeat',
            action: 'updated',
            typeId: eventTypeId,
            nodeId: null,
            severity: "information",
            data: data || {}
        };

        return self.publishExternalEvent(heartbeatEvent);
    };

    EventsProtocol.prototype.publishGraphEvent = function (graphId, action, nodeId, data){
        var self = this;
        assert.string(graphId, 'graphId');
        assert.string(action, 'action');

        var graphEvent = {
            type: 'graph',
            action: action,
            typeId: graphId,
            nodeId: nodeId,
            severity: "information",
            data: data || {}
        };

        return self.publishExternalEvent(graphEvent);
    };

    EventsProtocol.prototype.publishNodeEvent = function (node, action, data, severity) {
        var self = this;
        assert.object(node, 'node');
        assert.string(action, 'action');

        var nodeEvent = {
            type: 'node',
            action: action,
            typeId: node.id,
            nodeId: node.id,
            severity: severity || "information",
            data: data || {}
        };

        nodeEvent.data.nodeType = node.type;

        return self.publishExternalEvent(nodeEvent);
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

    EventsProtocol.prototype.publishProgressEvent = function (graphId, data) {
        var self = this;
        assert.object(data, 'data');
        assert.string(graphId, 'graphId');

        return self.publishGraphEvent(graphId, 'progress.updated', data.nodeId, data);
    };

    EventsProtocol.prototype.subscribeSelEvent = function (severity, pollerId, nodeId, callback) {
        assert.isMongoId(pollerId, 'subscribeSelEvent requires pollerId');
        assert.isMongoId(nodeId, 'subscribeSelEvents requires nodeId');
        assert.func(callback, 'subscribeSelEvents requires callback function');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'polleralert.sel.updated.%s.%s.%s'.format(severity, pollerId, nodeId),
            callback
        );
    };

    return new EventsProtocol();
}


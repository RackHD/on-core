// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskProtocolFactory;

di.annotate(taskProtocolFactory, new di.Provide('Protocol.Task'));
di.annotate(taskProtocolFactory,
    new di.Inject(
        'Assert',
        'Constants',
        'Services.Messenger',
        '_'
    )
);

function taskProtocolFactory (assert, Constants, messenger, _) {
    function TaskProtocol() {
    }

    TaskProtocol.prototype.run = function (taskId, args) {
        assert.uuid(taskId);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'run' + '.' + taskId,
            args || {}
        );
    };

    TaskProtocol.prototype.cancel = function (taskId, args) {
        assert.uuid(taskId);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'cancel' + '.' + taskId,
            args || {}
        );
    };

    TaskProtocol.prototype.publishCommandResults = function (routingKey, results) {
        assert.string(routingKey);
        assert.object(results);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            routingKey,
            results
        );
    };

    TaskProtocol.prototype.requestProfile = function (id, args) {
        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestProfile' + '.' + id,
            args || {}
        );
    };

    TaskProtocol.prototype.requestProperties = function requestProperties(id, args) {
        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestProperties' + '.' + id,
            args || {}
        );
    };

    TaskProtocol.prototype.requestCommands = function requestCommands(id, args) {
        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestCommands' + '.' + id,
            args || {}
        );
    };

    TaskProtocol.prototype.respondCommands = function respondCommands(id, data) {
        assert.string(id);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.respondCommands' + '.' + id,
            data || {}
        );
    };

    TaskProtocol.prototype.getBootFile = function (nodeId, options) {
        assert.isMongoId(nodeId);
        assert.object(options, 'options');

        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.getBootFile' + '.' + nodeId,
            options || {}
        );
    };

    TaskProtocol.prototype.activeTaskExists = function (nodeId) {
        assert.isMongoId(nodeId);

        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.activeTaskExists' + '.' + nodeId,
            nodeId
        );
    };

    TaskProtocol.prototype.subscribeRun = function(taskId, callback) {
        assert.ok(taskId);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'run' + '.' + taskId,
            callback
        );
    };

    TaskProtocol.prototype.subscribeCancel = function(taskId, callback) {
        assert.ok(taskId);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'cancel' + '.' + taskId,
            callback
        );
    };

    TaskProtocol.prototype.subscribeRequestProperties = function (identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestProperties' + '.' + identifier,
            function(data, message) {
                message.promise(
                    callback()
                );
            }
        );
    };

    TaskProtocol.prototype.subscribeRequestProfile = function (identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestProfile' + '.' + identifier,
            function(data, message) {
                message.promise(
                    callback()
                );
            }
        );
    };

    TaskProtocol.prototype.subscribeRequestCommands = function (identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestCommands' + '.' + identifier,
            function(data, message) {
                message.promise(
                    callback()
                );
            }
        );
    };

    TaskProtocol.prototype.subscribeRespondCommands = function (identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.respondCommands' + '.' + identifier,
            callback
        );
    };


    TaskProtocol.prototype.subscribeDhcpBoundLease = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'dhcp.bind.success' + '.' + nodeId,
            callback
        );
    };

    TaskProtocol.prototype.subscribeTftpSuccess = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'tftp.success' + '.' + nodeId,
            callback
        );
    };

    TaskProtocol.prototype.subscribeHttpResponse = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'http.response' + '.' + nodeId,
            callback
        );
    };

    return new TaskProtocol();
}

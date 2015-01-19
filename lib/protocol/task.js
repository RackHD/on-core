// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskProtocolFactory;

di.annotate(taskProtocolFactory, new di.Provide('Protocol.Task'));
di.annotate(taskProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Protocol.Exchanges.Task',
        'Protocol.Exchanges.Events',
        'Assert',
        '_'
    )
);

function taskProtocolFactory (messenger, taskExchange, eventsExchange, assert, _) {
    function TaskProtocol() {
    }

    TaskProtocol.prototype.run = function(taskId, args) {
        assert.uuid(taskId);

        return messenger.publish(
            taskExchange.exchange,
            'run' + '.' + taskId,
            args || {}
        );
    };

    TaskProtocol.prototype.cancel = function(taskId, args) {
        assert.uuid(taskId);

        return messenger.publish(
            taskExchange.exchange,
            'cancel' + '.' + taskId,
            args || {}
        );
    };

    TaskProtocol.prototype.requestProfile = function requestProfile(id) {
        return messenger.request(
            taskExchange.exchange,
            'methods.requestProfile' + '.' + id
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskProtocol.prototype.requestProperties = function requestProperties(id) {
        return messenger.request(
            taskExchange.exchange,
            'methods.requestProperties' + '.' + id
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskProtocol.prototype.commandRequest = function commandRequest(id) {
        return messenger.request(
            taskExchange.exchange,
            'methods.commandRequest' + '.' + id
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskProtocol.prototype.commandResponse = function commandResponse(id) {
        return messenger.Response(
            taskExchange.exchange,
            'methods.commandResponse' + '.' + id
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskProtocol.prototype.getBootFile = function getBootFile(nodeId, options) {
        return messenger.request(
                taskExchange.exchange,
                'methods.getBootFile' + '.' + nodeId,
                options
            )
            .then(function(message) {
                assert.object(message);
                // Object serialization seems to cause empty keys to be removed
                return _.isEmpty(message.data) ? undefined : message.data.result;
            });
    };

    TaskProtocol.prototype.activeTaskExists = function activeTaskExists(identifier) {
        return messenger.request(
                taskExchange.exchange,
                'methods.activeTaskExists' + '.' + identifier,
                identifier
            )
            .then(function(message) {
                assert.object(message);
                // Object serialization seems to cause empty keys to be removed
                return _.isEmpty(message.data) ? undefined : message.data.result;
            });
    };

    TaskProtocol.prototype.subscribeRun = function(taskId, callback) {
        assert.ok(taskId);
        assert.func(callback);

        return messenger.subscribe(
                taskExchange.exchange,
                'run' + '.' + taskId,
                function() {
                    var _callback = callback;
                    _callback();
                }
        );
    };

    TaskProtocol.prototype.subscribeCancel = function(taskId, callback) {
        assert.ok(taskId);
        assert.func(callback);
        return messenger.subscribe(
                taskExchange.exchange,
                'cancel' + '.' + taskId,
                function() {
                    var _callback = callback;
                    _callback();
                }
        );
    };

    TaskProtocol.prototype.subscribeRequestProperties =
                        function subscribeRequestProperties(identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);
        return messenger.subscribe(
                taskExchange.exchange,
                'methods.requestProperties' + '.' + identifier,
                function(message) {
                    var _callback = callback;
                    var result = _callback();
                    message.respond({ result: result });
                }
        );
    };

    TaskProtocol.prototype.subscribeRequestProfile =
                        function subscribeRequestProfile(identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);
        return messenger.subscribe(
                taskExchange.exchange,
                'methods.requestProfile' + '.' + identifier,
                function(message) {
                    var _callback = callback;
                    var result = _callback();
                    message.respond({ result: result });
                }
        );
    };

    TaskProtocol.prototype.subscribeCommandRequest =
                        function subscribeCommandRequest(identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);
        return messenger.subscribe(
                taskExchange.exchange,
                'methods.commandRequest' + '.' + identifier,
                function(message) {
                    var _callback = callback;
                    var result = _callback();
                    message.respond({ result: result });
                }
        );
    };

    TaskProtocol.prototype.subscribeCommandResponse =
                        function subscribeCommandResponse(identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);
        return messenger.subscribe(
                taskExchange.exchange,
                'methods.commandResponse' + '.' + identifier,
                function(message) {
                    var _callback = callback;
                    _callback(message.data);
                }
        );
    };

    TaskProtocol.prototype.subscribeDhcpBoundLease =
                        function subscribeDhcpBoundLease(identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);
        return messenger.subscribe(
                eventsExchange.exchange,
                'dhcp.bind.success' + '.' + identifier,
                function(message) {
                    var _callback = callback;
                    _callback(message.data, message);
                }
        );
    };

    TaskProtocol.prototype.subscribeTftpSuccess =
                        function subscribeTftpSuccess(identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);
        return messenger.subscribe(
                eventsExchange.exchange,
                'tftp.success' + '.' + identifier,
                function(message) {
                    var _callback = callback;
                    _callback(message.data, message);
                }
        );
    };

    TaskProtocol.prototype.subscribeHttpResponse =
                        function subscribeHttpResponse(identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);
        return messenger.subscribe(
                eventsExchange.exchange,
                'http.response' + '.' + identifier,
                function(message) {
                    var _callback = callback;
                    _callback(message.data, message);
                }
        );
    };

    return new TaskProtocol();
}

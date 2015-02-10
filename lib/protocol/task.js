// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskProtocolFactory;

di.annotate(taskProtocolFactory, new di.Provide('Protocol.Task'));
di.annotate(taskProtocolFactory,
    new di.Inject(
        'Q',
        'Assert',
        'Constants',
        'Services.Messenger',
        '_',
        'Result'
    )
);

function taskProtocolFactory (Q, assert, Constants, messenger, _, Result) {
    function TaskProtocol() {
    }

    TaskProtocol.prototype.run = function (taskId, args) {
        assert.uuid(taskId);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'run' + '.' + taskId,
            new Result({ value: args })
        );
    };

    TaskProtocol.prototype.cancel = function (taskId, args) {
        assert.uuid(taskId);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'cancel' + '.' + taskId,
            new Result({ value: args })
        );
    };

    TaskProtocol.prototype.publishCommandResults = function (routingKey, results) {
        assert.string(routingKey);
        assert.object(results);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            routingKey,
            new Result({ value: results })
        );
    };

    TaskProtocol.prototype.requestProfile = function (id, args) {
        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestProfile' + '.' + id,
            args || {}
        ).then(function (data) {
            return data.value;
        });
    };

    TaskProtocol.prototype.requestProperties = function requestProperties(id, args) {
        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestProperties' + '.' + id,
            args || {}
        ).then(function (data) {
            return data.value;
        });
    };

    TaskProtocol.prototype.requestCommands = function requestCommands(id, args) {
        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestCommands' + '.' + id,
            args || {}
        ).then(function (data) {
            return data.value;
        });
    };

    TaskProtocol.prototype.respondCommands = function respondCommands(id, data) {
        assert.string(id);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.respondCommands' + '.' + id,
            new Result({ value: data })
        );
    };

    TaskProtocol.prototype.getBootFile = function (nodeId, options) {
        assert.isMongoId(nodeId);
        assert.object(options, 'options');

        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.getBootFile' + '.' + nodeId,
            options || {}
        ).then(function (data) {
            return data.value;
        });
    };

    TaskProtocol.prototype.activeTaskExists = function (nodeId) {
        assert.isMongoId(nodeId);

        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.activeTaskExists' + '.' + nodeId,
            nodeId
        ).then(function (data) {
            return data.value;
        });
    };

    TaskProtocol.prototype.subscribeRun = function(taskId, callback) {
        assert.ok(taskId);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'run' + '.' + taskId,
            function(data) {
                callback(data.value);
            }
        );
    };

    TaskProtocol.prototype.subscribeCancel = function(taskId, callback) {
        assert.ok(taskId);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'cancel' + '.' + taskId,
            function(data) {
                callback(data.value);
            }
        );
    };

    TaskProtocol.prototype.subscribeRequestProperties = function (identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestProperties' + '.' + identifier,
            function(data, message) {
                Q.resolve(
                    callback()
                ).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
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
                Q.resolve(
                    callback()
                ).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
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
                Q.resolve(
                    callback()
                ).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };

    TaskProtocol.prototype.subscribeRespondCommands = function (identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.respondCommands' + '.' + identifier,
            function(data) {
                callback(data.value);
            }
        );
    };


    // NOTE: subscribes onto the events exchange
    TaskProtocol.prototype.subscribeDhcpBoundLease = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'dhcp.bind.success' + '.' + nodeId,
            callback
        );
    };

    // NOTE: subscribes onto the events exchange
    TaskProtocol.prototype.subscribeTftpSuccess = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'tftp.success' + '.' + nodeId,
            callback
        );
    };

    // NOTE: subscribes onto the events exchange
    TaskProtocol.prototype.subscribeHttpResponse = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Events.Name,
            'http.response' + '.' + nodeId,
            callback
        );
    };

    TaskProtocol.prototype.publishRunIpmiCommand = function (uuid, command, data) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.string(command);
        assert.object(data);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            ['ipmi', 'command', command, uuid].join('.'),
            new Result({ value: data })
        );
    };

    TaskProtocol.prototype.subscribeRunIpmiCommand = function (uuid, command, callback) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.string(command);
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            ['ipmi', 'command', command, uuid].join('.'),
            function(data) {
                callback(data.value);
            }
        );
    };

    TaskProtocol.prototype.subscribeIpmiCommandResult = function (uuid, command, callback) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.string(command);
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            ['ipmi', 'command', command, 'result', uuid].join('.'),
            function(data) {
                callback(data.value);
            }
        );
    };

    TaskProtocol.prototype.publishIpmiCommandResult = function (uuid, command, result) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.string(command);
        assert.ok(result);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            ['ipmi', 'command', command, 'result', uuid].join('.'),
            new Result({ value: result })
        );
    };

    TaskProtocol.prototype.publishRunSnmpCommand = function (uuid, data) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.object(data);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'run.snmp.command' + '.' + uuid,
            new Result({ value: data })
        );
    };

    TaskProtocol.prototype.subscribeRunSnmpCommand = function (uuid, callback) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'run.snmp.command' + '.' + uuid,
            function(data) {
                callback(data.value);
            }
        );
    };

    TaskProtocol.prototype.subscribeSnmpCommandResult = function (uuid, callback) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'snmp.command.result' + '.' + uuid,
            function(data) {
                callback(data.value);
            }
        );
    };

    TaskProtocol.prototype.publishSnmpCommandResult = function (uuid, results) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.object(results);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'snmp.command.result' + '.' + uuid,
            new Result({ value: results })
        );
    };

    // NOTE: publishes onto the events exchange
    TaskProtocol.prototype.publishPollerAlert = function (uuid, results) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.object(results);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            'poller.alert' + '.' + uuid,
            new Result({ value: results })
        );
    };

    TaskProtocol.prototype.requestPollerCache = function requestPollerCache(workItemId) {
        assert.string(workItemId);

        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestPollerCache',
            new Result({ value: workItemId })
        ).then(function (data) {
            return data.value;
        });
    };

    TaskProtocol.prototype.subscribeRequestPollerCache = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestPollerCache',
            function(data, message) {
                Q.resolve(
                    callback(data.value)
                ).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
            }
        );
    };


    return new TaskProtocol();
}

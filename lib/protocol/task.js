// Copyright 2015, EMC, Inc.

'use strict';

module.exports = taskProtocolFactory;

taskProtocolFactory.$provide = 'Protocol.Task';
taskProtocolFactory.$inject = [
    'Promise',
    'Assert',
    'Constants',
    'Errors',
    'Services.Messenger',
    '_',
    'Result'
];

function taskProtocolFactory (Promise, assert, Constants, Errors, messenger, _, Result) {
    function TaskProtocol() {
    }

    TaskProtocol.prototype.run = function (domain, data) {
        assert.string(domain);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            domain + '.' + 'methods.run',
            data || {}
        );
    };

    TaskProtocol.prototype.subscribeRun = function(domain, callback) {
        assert.string(domain);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            domain + '.' + 'methods.run',
            callback
        );
    };

    TaskProtocol.prototype.cancel = function (taskId, errName, errMessage) {
        assert.uuid(taskId);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.cancel',
            { taskId: taskId, errName: errName, errMessage: errMessage }
        );
    };

    TaskProtocol.prototype.subscribeCancel = function(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.cancel',
            function(data) {
                if (!data.errName) {
                    callback(data);
                }
                // Re-create error sent over the wire
                if (Errors[data.errName]) {
                    callback(new Errors[data.errName](data.errMessage));
                } else {
                    callback(new Error(data.errMessage));
                }
            }
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

    TaskProtocol.prototype.subscribeRequestProfile = function (identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestProfile' + '.' + identifier,
            function(data, message) {
                Promise.resolve().then(function() {
                    return callback();
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
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

    TaskProtocol.prototype.subscribeRequestProperties = function (identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestProperties' + '.' + identifier,
            function(data, message) {
                Promise.resolve().then(function() {
                    return callback();
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
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

    TaskProtocol.prototype.subscribeRequestCommands = function (identifier, callback) {
        assert.ok(identifier);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestCommands' + '.' + identifier,
            function(data, message) {
                Promise.resolve().then(function() {
                    return callback();
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };
    TaskProtocol.prototype.respondCommands = function respondCommands(id, data) {
        assert.string(id);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.respondCommands' + '.' + id,
            new Result({ value: data })
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

    TaskProtocol.prototype.getBootProfile = function (nodeId, options) {
        assert.isMongoId(nodeId);

        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.getBootProfile' + '.' + nodeId,
            options || {}
        ).then(function (data) {
            return data.value;
        });
    };

    TaskProtocol.prototype.subscribeGetBootProfile = function (nodeId, callback) {
        assert.isMongoId(nodeId);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.getBootProfile' + '.' + nodeId,
            function(data, message) {
                Promise.resolve().then(function() {
                    return callback(data.value);
                }).then(function(result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                })
                .catch(function(error) {
                    return message.reject(error);
                });
            }
        );
    };

    TaskProtocol.prototype.activeTaskExists = function (target) {
        assert.string(target);

        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.activeTaskExists' + '.' + target,
            {}
        ).then(function (data) {
            return data.value;
        });
    };

    TaskProtocol.prototype.subscribeActiveTaskExists = function(target, callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.activeTaskExists' + '.' + target,
            function(data, message) {
                Promise.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
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

    TaskProtocol.prototype.subscribeMetricResult = function (uuid, name, callback) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.string(name);
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            ['metric', name, 'result', uuid].join('.'),
            function(data, envelope) {
                var metricName = envelope.deliveryInfo.routingKey.split('.')[1];
                callback(data.value, metricName);
            }
        );
    };

    TaskProtocol.prototype.publishMetricResult = function (uuid, name, result) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.string(name);
        assert.object(result);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            ['metric', name, 'result', uuid].join('.'),
            new Result({ value: result })
        );
    };

    // NOTE: publishes onto the events exchange
    TaskProtocol.prototype.publishPollerAlert = function (uuid, pollerName, results) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.string(pollerName, 'poller name suffix');
        assert.object(results);

        return messenger.publish(
            Constants.Protocol.Exchanges.Events.Name,
            ['poller.alert', pollerName, uuid].join('.'),
            new Result({ value: results })
        );
    };


    TaskProtocol.prototype.requestPollerCache = function (workItemId, options) {
        assert.string(workItemId);

        return messenger.request(
            Constants.Protocol.Exchanges.Task.Name,
            'methods.requestPollerCache',
            new Result({ value: workItemId, options: options })
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
                Promise.resolve().then(function() {
                    return callback(data.value, data.options);
                }).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
            }
        );
    };

    TaskProtocol.prototype.publishAnsibleResult = function (uuid, data) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.object(data);

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'run.ansible.command' + '.' + uuid,
            new Result({ value: data })
        );
    };

    TaskProtocol.prototype.subscribeAnsibleCommand = function (uuid, callback) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'run.ansible.command' + '.' + uuid,
            function(data) {
                callback(data.value);
            }
        );
    };

    TaskProtocol.prototype.publishTrigger = function (uuid, type, group) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.string(type, 'trigger type');
        assert.string(group, 'trigger group');

        return messenger.publish(
            Constants.Protocol.Exchanges.Task.Name,
            'trigger' + '.' + uuid + '.' + group + '.' + type,
            {}
        );
    };

    TaskProtocol.prototype.subscribeTrigger = function (uuid, type, group, callback) {
        assert.uuid(uuid, 'routing key uuid suffix');
        assert.string(type, 'trigger type');
        assert.string(group, 'trigger group');
        assert.func(callback, 'callback');

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Task.Name,
            'trigger' + '.' + uuid + '.' + group + '.' + type,
            function() {
                callback();
            }
        );
    };

    return new TaskProtocol();
}

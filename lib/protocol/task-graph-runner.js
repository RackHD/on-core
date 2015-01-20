// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskGraphRunnerProtocolFactory;

di.annotate(taskGraphRunnerProtocolFactory, new di.Provide('Protocol.TaskGraphRunner'));
di.annotate(taskGraphRunnerProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Protocol.Exchanges.TaskGraphRunner',
        'Assert',
        '_'
    )
);

function taskGraphRunnerProtocolFactory (messenger, taskGraphRunnerExchange, assert, _) {
    function TaskGraphRunnerProtocol() {
    }

    TaskGraphRunnerProtocol.prototype.getTaskGraphLibrary = function getTaskGraphLibrary(filter) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.getTaskGraphLibrary',
            { filter: filter }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.getTaskLibrary = function getTaskLibrary(filter) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.getTaskLibrary',
            { filter: filter }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.getActiveTaskGraph = function getActiveTaskGraph(filter) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.getActiveTaskGraph',
            { filter: filter }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.getActiveTaskGraphs = function getActiveTaskGraphs(filter) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.getActiveTaskGraphs',
            { filter: filter }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.defineTaskGraph = function defineTaskGraph(definition) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.defineTaskGraph',
            { definition: definition }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.defineTask = function defineTask(definition) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.defineTask',
            { definition: definition }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.runTaskGraph = function runTaskGraph(name, options, target) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.runTaskGraph',
            { name: name, options: options, target: target }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.cancelTaskGraph = function cancelTaskGraph(filter) {
        assert.object(filter);
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.cancelTaskGraph',
            filter
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.pauseTaskGraph = function pauseTaskGraph(filter) {
        assert.object(filter);
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.pauseTaskGraph',
            filter
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.resumeTaskGraph = function resumeTaskGraph(filter) {
        assert.object(filter);
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.resumeTaskGraph',
            filter
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.getTaskGraphProperties = function getTaskGraphProperties(instance) {
        return messenger.request(
            taskGrapRunnerExchange.exchange,
            'methods.getTaskGraphProperties',
            { instance: instance }
        ).then(function(message) {
                assert.object(message);
                return _.isEmpty(message.data) ? undefined : message.data.result;
            });
    };

    TaskGraphRunnerProtocol.prototype.requestTasks = function requestTasks(instance) {
        return messenger.request(
            taskGrapRunnerExchange.exchange,
            'methods.requestTasks',
            { instance: instance }
        ).then(function(message) {
                assert.object(message);
                return _.isEmpty(message.data) ? undefined : message.data.result;
            });
    };

    TaskGraphRunnerProtocol.prototype.publishTasks = function publishTasks(instance) {
        return messenger.request(
            taskGrapRunnerExchange.exchange,
            'methods.publishTasks',
            { instance: instance }
        ).then(function(message) {
                assert.object(message);
                return _.isEmpty(message.data) ? undefined : message.data.result;
            });
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskGraphLibrary =
                        function subscribeGetTaskGraphLibrary(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.getTaskGraphLibrary', function(message) {
                var _callback = callback;
                assert.object(message);
                var result = _callback(message.data ? message.data.filter : undefined);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskLibrary =
                        function subscribeGetTaskLibrary(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.getTaskLibrary', function(message) {
                var _callback = callback;
                assert.object(message);
                var result = _callback(message.data ? message.data.filter : undefined);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeDefineTaskGraph =
                                        function subscribeDefineTaskGraph(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.defineTaskGraph', function(message) {
                var _callback = callback;
                assert.object(message);
                assert.object(message.data);
                assert.object(message.data.definition);
                var result = _callback(message.data.definition);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeDefineTask =
                                        function subscribeDefineTask(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.defineTask', function(message) {
                var _callback = callback;
                assert.object(message);
                assert.object(message.data);
                assert.object(message.data.definition);
                var result = _callback(message.data.definition);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetActiveTaskGraph =
                                        function subscribeGetActiveTaskGraph(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.getActiveTaskGraph', function(message) {
                var _callback = callback;
                assert.object(message);
                var result = _callback(message.data ? message.data.filter : undefined);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetActiveTaskGraphs =
                                        function subscribeGetActiveTaskGraphs(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.getActiveTaskGraphs', function(message) {
                var _callback = callback;
                assert.object(message);
                var result = _callback(message.data ? message.data.filter : undefined);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeRunTaskGraph =
                                        function subscribeRunTaskGraph(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.runTaskGraph', function(message) {
                var _callback = callback;
                assert.object(message);
                assert.object(message.data);
                assert.string(message.data.name);
                var result = _callback(message.data.name,
                    message.data.options, message.data.target);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeCancelTaskGraph =
                                        function subscribeCancelTaskGraph(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.cancelTaskGraph', function(message) {
                var _callback = callback;
                assert.object(message);
                assert.object(message.data);
                var result = _callback(message.data);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribePauseTaskGraph =
                                        function subscribePauseTaskGraph(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.pauseTaskGraph', function(message) {
                var _callback = callback;
                assert.object(message);
                assert.object(message.data);
                var result = _callback(message.data);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeResumeTaskGraph =
                                        function subscribeResumeTaskGraph(callback) {
        return messenger.subscribe(
            taskGraphRunnerExchange.exchange,
            'methods.resumeTaskGraph', function(message) {
                var _callback = callback;
                assert.object(message);
                assert.object(message.data);
                var result = _callback(message.data);
                message.respond({ result: result });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskGraphProperties =
        function subscribeGetTaskGraphProperties(callback) {
            return messenger.subscribe(
                taskGrapRunnerExchange.exchange,
                'methods.subscribeGetTaskGraphProperties', function(message) {
                    var _callback = callback;
                    assert.object(message);
                    assert.object(message.data);
                    assert.string(message.data.instance);
                    var result = _callback(message.data.instance);
                    message.respond({ result: result });
                }
            );
        };

    TaskGraphRunnerProtocol.prototype.subscribeRequestTasks =
        function subscribeGetTaskGraphProperties(callback) {
            return messenger.subscribe(
                taskGrapRunnerExchange.exchange,
                'methods.subscribeRequestTasks', function(message) {
                    var _callback = callback;
                    assert.object(message);
                    assert.object(message.data);
                    assert.string(message.data.instance);
                    var result = _callback(message.data.instance);
                    message.respond({ result: result });
                }
            );
        };

    TaskGraphRunnerProtocol.prototype.subscribePublishTasks =
        function subscribeGetTaskGraphProperties(callback) {
            return messenger.subscribe(
                taskGrapRunnerExchange.exchange,
                'methods.subscribePublishTasks', function(message) {
                    var _callback = callback;
                    assert.object(message);
                    assert.object(message.data);
                    assert.string(message.data.instance);
                    var result = _callback(message.data.instance);
                    message.respond({ result: result });
                }
            );
        };

    return new TaskGraphRunnerProtocol();
}
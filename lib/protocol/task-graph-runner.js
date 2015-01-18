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

    TaskGraphRunnerProtocol.prototype.runTaskGraph = function runTaskGraph(name, options) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.runTaskGraph',
            { name: name, options: options }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.cancelTaskGraph = function cancelTaskGraph(instance) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.cancelTaskGraph',
            { instance: instance }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.pauseTaskGraph = function pauseTaskGraph(instance) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.pauseTaskGraph',
            { instance: instance }
        ).then(function(message) {
            assert.object(message);
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    TaskGraphRunnerProtocol.prototype.resumeTaskGraph = function resumeTaskGraph(instance) {
        return messenger.request(
            taskGraphRunnerExchange.exchange,
            'methods.resumeTaskGraph',
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
                var result = _callback(message.data.name, message.data.options);
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
                assert.string(message.data.instance);
                var result = _callback(message.data.instance);
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
                assert.string(message.data.instance);
                var result = _callback(message.data.instance);
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
                assert.string(message.data.instance);
                var result = _callback(message.data.instance);
                message.respond({ result: result });
            }
        );
    };

    return new TaskGraphRunnerProtocol();
}

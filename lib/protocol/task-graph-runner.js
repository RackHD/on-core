// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskGraphRunnerProtocolFactory;

di.annotate(taskGraphRunnerProtocolFactory, new di.Provide('Protocol.TaskGraphRunner'));
di.annotate(taskGraphRunnerProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Constants',
        'Assert',
        '_'
    )
);

function taskGraphRunnerProtocolFactory (messenger, Constants, assert, _) {
    function TaskGraphRunnerProtocol() {
    }

    TaskGraphRunnerProtocol.prototype.getTaskGraphLibrary = function (filter) {
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getTaskGraphLibrary',
            { filter: filter }
        );
    };

    TaskGraphRunnerProtocol.prototype.getTaskLibrary = function (filter) {
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getTaskLibrary',
            { filter: filter }
        );
    };

    TaskGraphRunnerProtocol.prototype.getActiveTaskGraph = function (filter) {
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getActiveTaskGraph',
            { filter: filter }
        );
    };

    TaskGraphRunnerProtocol.prototype.getActiveTaskGraphs = function (filter) {
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getActiveTaskGraphs',
            { filter: filter }
        );
    };

    TaskGraphRunnerProtocol.prototype.defineTaskGraph = function (definition) {
        // TODO: BBP what asserts to we need here?

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.defineTaskGraph',
            { definition: definition }
        );
    };

    TaskGraphRunnerProtocol.prototype.defineTask = function (definition) {
        // TODO: BBP what asserts to we need here?

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.defineTask',
            { definition: definition }
        );
    };

    TaskGraphRunnerProtocol.prototype.runTaskGraph = function (name, options, target) {
        // TODO: BBP what asserts to we need here?

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.runTaskGraph',
            { name: name, options: options, target: target }
        );
    };

    TaskGraphRunnerProtocol.prototype.cancelTaskGraph = function (filter) {
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.cancelTaskGraph',
            filter
        );
    };

    TaskGraphRunnerProtocol.prototype.pauseTaskGraph = function (filter) {
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.pauseTaskGraph',
            filter
        );
    };

    TaskGraphRunnerProtocol.prototype.resumeTaskGraph = function (filter) {
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.resumeTaskGraph',
            filter
        );
    };

    TaskGraphRunnerProtocol.prototype.getTaskGraphProperties = function (instance) {
        // TODO: BBP what asserts to we need here?

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getTaskGraphProperties',
            { instance: instance }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskGraphLibrary = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getTaskGraphLibrary',
            function(data, message) {
                message.promise(
                    callback(data.filter)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskLibrary = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getTaskLibrary',
            function(data, message) {
                message.promise(
                    callback(data.filter)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeDefineTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.defineTaskGraph',
            function(data, message) {
                message.promise(
                    callback(data.definition)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeDefineTask = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.defineTask',
            function (data, message) {
                message.promise(
                    callback(data.definition)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetActiveTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getActiveTaskGraph',
            function (data, message) {
                message.promise(
                    callback(data.filter)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetActiveTaskGraphs = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getActiveTaskGraphs',
            function (data, message) {
                message.promise(
                    callback(data.filter)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeRunTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.runTaskGraph',
            function (data, message) {
                message.promise(
                    callback(data.name, data.options, data.target)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeCancelTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.cancelTaskGraph',
            function (data, message) {
                message.promise(
                    callback(data)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribePauseTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.pauseTaskGraph',
            function (data, message) {
                message.promise(
                    callback(data)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeResumeTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.resumeTaskGraph',
            function (data, message) {
                message.promise(
                    callback(data)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskGraphProperties = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.TaskGraphRunner.Exchange.Name,
            'methods.subscribeGetTaskGraphProperties',
            function (data, message) {
                message.promise(
                    callback(data.instance)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeRequestTasks = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.TaskGraphRunner.Exchange.Name,
            'methods.subscribeRequestTasks',
            function (data, message) {
                message.promise(
                    callback(data.instance)
                );
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribePublishTasks = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.TaskGraphRunner.Exchange.Name,
            'methods.subscribePublishTasks',
            function (data, message) {
                message.promise(
                    callback(data.instance)
                );
            }
        );
    };

    return new TaskGraphRunnerProtocol();
}

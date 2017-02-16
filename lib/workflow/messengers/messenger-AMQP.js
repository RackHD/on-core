// Copyright 2016-2017, Dell EMC, Inc.

'use strict';
module.exports = amqpMessengerFactory;
amqpMessengerFactory.$provide = 'Task.Messengers.AMQP';
amqpMessengerFactory.$inject = [
    'Constants',
    'Protocol.Task',
    'Protocol.Events',
    'Protocol.TaskGraphRunner',
    'Services.Waterline',
    'Assert',
    '_',
    'Promise'
];

function amqpMessengerFactory(
    Constants,
    taskProtocol,
    eventsProtocol,
    taskGraphRunnerProtocol,
    waterline,
    assert,
    _,
    Promise
) {
    var exports = {};

    exports.subscribeRunTask = function(domain, callback) {
        return taskProtocol.subscribeRun(domain, callback);
    };

    exports.publishRunTask = function(domain, taskId, graphId) {
        return taskProtocol.run(domain, { taskId: taskId, graphId: graphId });
    };

    exports.subscribeCancelTask = function(callback) {
        return taskProtocol.subscribeCancel(callback);
    };

    exports.publishCancelTask = function(taskId, errName, errMessage) {
        return taskProtocol.cancel(taskId, errName, errMessage);
    };

    exports.subscribeTaskFinished = function(domain, callback) {
        return eventsProtocol.subscribeTaskFinished(domain, callback);
    };

    exports.publishTaskFinished = function(
        domain,
        taskId,
        graphId,
        state,
        error,
        context,
        terminalOnStates
    ) {
        return eventsProtocol.publishTaskFinished(
                domain,
                taskId,
                graphId,
                state,
                error,
                context,
                terminalOnStates
        );
    };

    exports.subscribeRunTaskGraph = function(domain, callback) {
        return taskGraphRunnerProtocol.subscribeRunTaskGraph(domain, callback);
    };

    exports.subscribeCancelGraph = function(callback) {
        return taskGraphRunnerProtocol.subscribeCancelTaskGraph(callback);
    };

    exports.publishCancelGraph = function(graphId) {
        return taskGraphRunnerProtocol.cancelTaskGraph(graphId);
    };

    exports.start = function() {
        return Promise.resolve();
    };

    return exports;
}

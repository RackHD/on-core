// Copyright 2015, EMC, Inc.

'use strict';

module.exports = amqpMessengerFactory;
amqpMessengerFactory.$provide = 'Task.Messengers.AMQP';
amqpMessengerFactory.$inject = [
    'Protocol.Task',
    'Protocol.Events',
    'Protocol.TaskGraphRunner',
    'Promise'
];
function amqpMessengerFactory(
    taskProtocol,
    eventsProtocol,
    taskGraphRunnerProtocol,
    Promise
) {
    var exports = {};

    exports.subscribeRunTask = function(domain, callback) {
        return taskProtocol.subscribeRun(domain, callback);
    };

    exports.publishRunTask = function(domain, taskId, graphId) {
        return taskProtocol.run(domain, { taskId: taskId, graphId: graphId });
    };

    exports.subscribeCancel = function(callback) {
        return taskProtocol.subscribeCancel(callback);
    };

    exports.publishCancelTask = function(taskId) {
        // err name? err message?
        return taskProtocol.cancel(taskId);
    };

    exports.subscribeTaskFinished = function(domain, callback) {
        return eventsProtocol.subscribeTaskFinished(domain, callback);
    };

    exports.publishTaskFinished = function(domain, taskId, graphId, state, terminalOnStates) {
        return eventsProtocol.publishTaskFinished(domain, taskId, graphId, state, terminalOnStates);
    };

    exports.subscribeRunTaskGraph = function(domain, callback) {
        return taskGraphRunnerProtocol.subscribeRunTaskGraph(domain, callback);
    };

    // TODO: implement
    exports.subscribeCancelGraph = function() {
        return taskGraphRunnerProtocol.subscribeCancelTaskGraph();
    };

    // TODO: implement
    exports.publishCancelGraph = function() {
        return taskGraphRunnerProtocol.cancelTaskGraph();
    };

    exports.start = function() {
        return Promise.resolve();
    };

    return exports;
}

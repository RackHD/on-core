// Copyright © 2016-2017 Dell Inc. or its subsidiaries.  All Rights Reserved.

'use strict';
module.exports = amqpMessengerFactory;
amqpMessengerFactory.$provide = 'Task.Messengers.AMQP';
amqpMessengerFactory.$inject = [
    'Constants',
    'Protocol.Task',
    'Protocol.Events',
    'Protocol.TaskGraphRunner',
    'Services.Waterline',
    'Logger',
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
    Logger,
    assert,
    _,
    Promise
) {
    var logger = Logger.initialize(amqpMessengerFactory);

    function AMQPMessenger() {
    }

    AMQPMessenger.prototype.subscribeRunTask = function(domain, callback) {
        return taskProtocol.subscribeRun(domain, callback);
    };

    AMQPMessenger.prototype.publishRunTask = function(domain, taskId, graphId) {
        return taskProtocol.run(domain, { taskId: taskId, graphId: graphId });
    };

    AMQPMessenger.prototype.subscribeCancelTask = function(callback) {
        return taskProtocol.subscribeCancel(callback);
    };

    AMQPMessenger.prototype.publishCancelTask = function(taskId, errName, errMessage) {
        return taskProtocol.cancel(taskId, errName, errMessage);
    };

    AMQPMessenger.prototype.subscribeTaskFinished = function(domain, callback) {
        return eventsProtocol.subscribeTaskFinished(domain, callback);
    };

    /**
     * Publishes a task finished event over AMQP
     *
     * @param {String} domain
     * @param {Object} task
     * @returns {Promise}
     * @memberOf AMQPMessenger
     */
    AMQPMessenger.prototype.publishTaskFinished = function(domain, task) {
        var errorMsg;
        if (task.error && task.error.stack) {
            errorMsg = task.error.stack;
        } else if (task.error) {
            errorMsg = task.error.toString();
        }
        return eventsProtocol.publishTaskFinished(
            domain,
            task.instanceId,
            task.context.graphId,
            task.state,
            errorMsg,
            task.context,
            task.definition.terminalOnStates
        )
        .catch(function(error) {
            logger.error('Error publishing task finished event', {
                taskId: task.instanceId,
                graphId: task.context.graphId,
                state: task.state,
                error: error
            });
        });
    };

    /**
     * Publish a graph started event over AMQP.
     *
     * @param {Object} graph
     * @returns {Promise}
     * @memberOf AMQPMessenger
     */
    AMQPMessenger.prototype.publishGraphStarted = function(graph) {
        return eventsProtocol.publishGraphStarted(graph.instanceId, graph._status, graph.node)
        .catch(function(error) {
            logger.error('Error publishing graph started event', {
                graphId: graph.instanceId,
                _status: graph._status,
                error: error
            });
        });
    };

    /**
     * Publish a graph finished event over AMQP.
     *
     * @param {Object} graph
     * @returns {Promise}
     * @memberOf AMQPMessenger
     */
    AMQPMessenger.prototype.publishGraphFinished = function(graph) {
        return eventsProtocol.publishGraphFinished(graph.instanceId, graph._status, graph.node)
        .catch(function(error) {
            logger.error('Error publishing graph finished event', {
                graphId: graph.instanceId,
                _status: graph._status,
                error: error
            });
        });
    };

    AMQPMessenger.prototype.subscribeRunTaskGraph = function(domain, callback) {
        return taskGraphRunnerProtocol.subscribeRunTaskGraph(domain, callback);
    };

    AMQPMessenger.prototype.subscribeCancelGraph = function(callback) {
        return taskGraphRunnerProtocol.subscribeCancelTaskGraph(callback);
    };

    AMQPMessenger.prototype.publishCancelGraph = function(graphId) {
        return taskGraphRunnerProtocol.cancelTaskGraph(graphId);
    };

    AMQPMessenger.prototype.start = function() {
        return Promise.resolve();
    };

    return new AMQPMessenger();
}

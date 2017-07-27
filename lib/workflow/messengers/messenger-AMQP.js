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

    AMQPMessenger.prototype.publishRunTask = function(domain, taskId, taskName, graphId, graphName) {
        return taskProtocol.run(domain, { taskId: taskId, taskName: taskName, graphId: graphId , graphName: graphName});
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
     * @param {Boolean} swallowError
     * @returns {Promise}
     * @memberOf AMQPMessenger
     */
    AMQPMessenger.prototype.publishTaskFinished = function(domain, task, swallowError) {
        var errorMsg;
        if (task.error && task.error.stack) {
            errorMsg = task.error.stack;
        } else if (task.error) {
            errorMsg = task.error.toString();
        }
      
        return eventsProtocol.publishTaskFinished(
            domain,
            task.instanceId,
            task.definition.injectableName,
            task.context.graphId,
            task.context.graphName,
            task.state,
            errorMsg,
            task.context,
            task.definition.terminalOnStates
        )
        .catch(function(error) {
            if(swallowError) {
                logger.error('Error publishing task finished event', {
                    taskId: task.instanceId,
                    graphId: task.context.graphId,
                    state: task.state,
                    error: error
                });
            } else {
                throw error;
            }
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

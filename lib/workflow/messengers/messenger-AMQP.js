// Copyright 2016, EMC, Inc.

'use strict';

module.exports = amqpMessengerFactory;
amqpMessengerFactory.$provide = 'Task.Messengers.AMQP';
amqpMessengerFactory.$inject = [
    'Protocol.Task',
    'Protocol.Events',
    'Protocol.TaskGraphRunner',
    'Services.Waterline',
    'Assert',
    '_',
    'Promise'
];

function amqpMessengerFactory(
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

    /**
     * Update graph progress in task dependencies, graph objects and AMQP channels
     * @param {String} graphId - graph id
     * @param {Object} data - an object of progress data that should include progress data
     * @returns {Promise}
     */
    exports.publishProgressEvent = function(graphId, data) {

        assert.uuid(graphId, "Progress data should include graphId");
        assert.object(data.progress, "Progress data should include progress info");

        return Promise.resolve()
        .then(function(){
            //Update graphName if it doesn't exist in data
            return waterline.graphobjects.findOne({instanceId: graphId})
            .then(function(graphObject){
                if(!_.has(data, 'graphName') &&
                   _.has(graphObject, 'definition.friendlyName')) {
                    data.graphName = graphObject.definition.friendlyName;
                }
                return graphObject;
            });
        })
        .then(function(graph){
            //Update taskName if it doesn't exist in data
            var task={};
            if (_.isEmpty(data, 'taskProgress') ||
                !_.has(data, 'taskProgress.taskId')) {
                return task;
            }
            if (_.has(graph, 'tasks') &&
                graph.tasks[data.taskProgress.taskId]) {
                task = graph.tasks[data.taskProgress.taskId];
            }
            if (!_.has(data, 'taskProgress.taskName') && !_.isEmpty(task)){
                data.taskProgress.taskName = task.friendlyName;
            }
            return task;
        })
        .then(function(task){
            //Validate taskProgress progress.value and progress.maximum
            if (!_.has(data, 'taskProgress.progress')) {
                return;
            }
            if (!_.isEmpty(task) && _.has(task, 'options')){
                data.taskProgress.progress.maximum =
                    task.options.totalSteps || data.taskProgress.progress.maximum;
            }
            if (data.taskProgress.progress.value > data.taskProgress.progress.maximum) {
                data.taskProgress.progress.value = data.taskProgress.progress.maximum;
            }
        })
        .then(function(){
            data.progress = _calProgressPercentage(data.progress);
            if (!_.has(data, 'graphId')){
                data.graphId = graphId;
            }
            if (_.has(data, 'taskProgress.progress')){
                data.taskProgress.progress = _calProgressPercentage(data.taskProgress.progress);
            }
            return eventsProtocol.publishProgressEvent(data);
        });
    };

    function _calProgressPercentage(data) {
        assert.string(data.description, "Progress data should include progress description");

        data.value = (data.value === null) ? data.value : parseInt(data.value);
        data.maximum = (data.maximum === null) ? data.maximum : parseInt(data.maximum);
        if (_.has(data, 'percentage')) {
            return data;
        }
        var percentage = 100 * _.round(parseInt(data.value) / parseInt(data.maximum), 2);
        if (percentage >= 0 && percentage <= 100) {
            data.percentage = percentage.toString() + '%';
        } else {
            data.percentage =  'Not Available';
        }

        return data;
    }

    exports.start = function() {
        return Promise.resolve();
    };

    return exports;
}

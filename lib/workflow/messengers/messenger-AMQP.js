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
        return Promise.try(function(){
            assert.uuid(graphId, "Progress data should include graphId");
            assert.object(data.progress, "Progress data should include progress info");
            return waterline.graphobjects.findOne({instanceId: graphId});
        })
        .then(function(graph){
            //Align graph progress data
            var graphDefinition;
            graph = graph || {};
            graphDefinition = graph.definition || {friendlyName: 'Not available'};
            data.graphId = data.graphId || graphId;
            data.nodeId = data.nodeId || graph.node;
            data.graphName = data.graphName || graphDefinition.friendlyName;
            data.progress.percentage =
                data.progress.percentage || _calProgressPercentage(data.progress);
            return graph;
        })
        .then(function(graph){
            //Align task progress data
            if (_.isEmpty(data.taskProgress)) {
                return;
            }
            var taskProgress = data.taskProgress;
            var taskList = graph.tasks || {};
            var task = taskList[taskProgress.taskId] || {friendlyName: 'Not available'};

            //Task started/finished progress will default set all maximum to 100
            //Rectification is required here
            if (taskProgress.progress.maximum.toString() === '100' && _.has(task, 'options')) {
                data.taskProgress.progress.maximum =
                    task.options.totalSteps || data.taskProgress.progress.maximum;
            }

            //Task finished progress will default set all value to 100
            //Rectification is required here
            if (taskProgress.progress.value.toString() === '100') {
                taskProgress.progress.value = taskProgress.progress.maximum;
            }

            taskProgress.taskName = taskProgress.taskName || task.friendlyName;
            taskProgress.progress.percentage =
                taskProgress.progress.percentage || _calProgressPercentage(taskProgress.progress);
        })
        .then(function(){
            return eventsProtocol.publishProgressEvent(graphId, data);
        });
    };

    function _calProgressPercentage(data) {
        var percentage = 100 * _.round(data.value / data.maximum, 2);
        if (percentage >= 0 && percentage <= 100) {
            percentage = percentage.toString() + '%';
        } else {
            percentage =  'Not available';
        }
        return percentage;
    }

    exports.start = function() {
        return Promise.resolve();
    };

    return exports;
}

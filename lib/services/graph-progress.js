// Copyright © 2017 Dell Inc. or its subsidiaries.  All Rights Reserved.

'use strict';

module.exports = graphProgressServiceFactory;

graphProgressServiceFactory.$provide = 'Services.GraphProgress';
graphProgressServiceFactory.$inject = [
    '_',
    'Protocol.Events',
    'Services.Waterline',
    'Logger',
    'Constants',
    'Promise',
    'Assert',
    'GraphProgress'
];

function graphProgressServiceFactory(
    _,
    eventsProtocol,
    waterline,
    Logger,
    Constants,
    Promise,
    assert,
    GraphProgress
) {
    var logger = Logger.initialize(graphProgressServiceFactory);

    function GraphProgressService() {
    }

    /**
     * Publish a graph started progress event over AMQP.
     *
     * @param {Object} graph
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishGraphStarted = function(graph) {
        assert.object(graph, 'graph');
        assert.string(graph.name , 'graph.name');

        var progress = GraphProgress.create(graph, 'Graph "' + graph.name + '" started');
        return eventsProtocol.publishProgressEvent(
            graph.instanceId,
            progress.getProgressEventData()
        )
        .catch(function(error) {
            logger.error('Error publishing graph started progress event', {
                graphId: graph.instanceId,
                _status: graph._status,
                error: error
            });
        });
    };

    /**
     * Publish a graph finished progress event over AMQP.
     *
     * @param {Object} graph
     * @param {String} graphState
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishGraphFinished = function(graph, graphState) {
        assert.object(graph, 'graph');
        assert.string(graph.name , 'graph.name');
        assert.string(graphState);

        var graphDescription = 'Graph "' + graph.name + '" ' + graphState;
        var progress = GraphProgress.create(graph, graphDescription);

        return eventsProtocol.publishProgressEvent(
            graph.instanceId,
            progress.getProgressEventData()
        )
        .catch(function(error) {
            logger.error('Error publishing graph finished progress event', {
                graphId: graph.instanceId,
                _status: graph._status,
                error: error
            });
        });
    };

    /**
     * Publishes a task started event over AMQP
     *
     * @param {Object} task
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishTaskStarted = function(task) {
        return waterline.graphobjects.findOne({ instanceId: task.context.graphId })
        .then(function(graph) {
            var taskFriendlyName = _.get(task, 'definition.friendlyName');
            var taskId = task.instanceId;
            var progressMaximum = _.size(_.get(task, 'definition.options.progressMilestones')) ||
                    Constants.Progress.DefaultTaskProgressMaximum;
            var taskProgress = {
                value: 0,
                maximum: progressMaximum,
                description: "Task started"
            };

            var graphDescription = 'Task "' + taskFriendlyName + '" started';
            var progress = GraphProgress.create(graph, graphDescription);
            progress.updateTaskProgress(taskId, taskProgress);
            return eventsProtocol.publishProgressEvent(graph.instanceId,
                                                       progress.getProgressEventData());
        })
        .catch(function(error) {
            logger.error('Error publishing progress event when task started', {
                taskId: task.instanceId,
                graphId: task.context.graphId,
                error: error
            });
        });
    };

    /**
     * Publish a task finished progress event over AMQP.
     *
     * @param {Object} task
     * @param {String} task.graphId - the unique ID of the graph to which the task belongs
     * @param {String} task.taskId - the unique ID of the task
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishTaskFinished = function(task) {
        assert.object(task, 'task');
        assert.uuid(task.graphId, 'task.graphId');
        assert.uuid(task.taskId, 'task.taskId');

        return waterline.graphobjects.findOne({ instanceId: task.graphId })
        .then(function(graph) {
            var _task = graph.tasks[task.taskId];
            var taskFriendlyName = _.get(_task, 'friendlyName');
            var progressMaximum = _.size(_.get(_task, 'options.progressMilestones')) ||
                    Constants.Progress.DefaultTaskProgressMaximum;
            var taskProgress = {
                value: progressMaximum,
                maximum: progressMaximum,
                description: "Task finished"
            };

            var graphDescription = 'Task "' + taskFriendlyName + '" finished';
            if (_task.error) {
                graphDescription += " with error";
            }

            var progress = GraphProgress.create(graph, graphDescription);
            progress.updateTaskProgress(task.taskId, taskProgress);
            return eventsProtocol.publishProgressEvent(graph.instanceId,
                                                       progress.getProgressEventData());
        })
        .catch(function(error) {
            logger.error('Error publishing task finished progress event', {
                taskId: task.taskId,
                graphId: task.graphId,
                error: error
            });
        });
    };

    /**
     * Publish a task progress event over AMQP.
     *
     * @param {String} graphId: graphId
     * @param {String} taskId: taskId
     * @param {Object} taskProgress: task progress information
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishTaskProgress = function(graphId, taskId, taskProgress) {
        assert.uuid(graphId);
        assert.uuid(taskId);
        assert.ok(taskProgress);

        return this.publishTaskProgressNotCatch(graphId, taskId, taskProgress)
        .catch(function(error) {
            //The event publish failure should be swallowed since it is not critical data and it
            //should never impact the normal process
            logger.error('Fail to publish graph progress event', {
                taskId: taskId,
                graphId: graphId,
                error: error
            });
        });
    };

    /**
     * Publish a task progress event over AMQP without swallowing errors.
     *
     * @param {String} graphId: graphId
     * @param {String} taskId: taskId
     * @param {Object} taskProgress: task progress information
     * @returns {Promise}
     * @memberOf GraphProgressService
     *
    */
    GraphProgressService.prototype.publishTaskProgressNotCatch = function(
        graphId,
        taskId,
        taskProgress
    ) {
        assert.uuid(graphId);
        assert.uuid(taskId);
        assert.ok(taskProgress);

        return waterline.graphobjects.findOne({instanceId: graphId})
        .then(function(graph) {
            var progress = GraphProgress.create(graph, taskProgress.description);
            progress.updateTaskProgress(taskId,
                    _.pick(taskProgress, ['value', 'maximum', 'description']));
            return eventsProtocol.publishProgressEvent(graph.instanceId,
                                                       progress.getProgressEventData());
        });
    };

    GraphProgressService.prototype.start = function() {
    };

    GraphProgressService.prototype.stop = function() {
    };

    return new GraphProgressService();
}

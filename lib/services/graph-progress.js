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

    GraphProgressService.prototype._publishGraphProgress = function(
        graph,
        graphState,
        options
    ) {
        options = options || {};
        return Promise.try(function() {
            assert.object(graph, 'graph');
            assert.string(graph.name , 'graph.name');
            assert.string(graphState, 'graphState');
        })
        .then(function() {
            var graphDescription = 'Graph "' + graph.name + '" ' + graphState;
            var progress = GraphProgress.create(graph, graphDescription);

            return eventsProtocol.publishProgressEvent(
                graph.instanceId,
                progress.getProgressEventData()
            );
        })
        .catch(function(error) {
            if(options.swallowError) {
                logger.error('Error publishing graph ' + graphState + ' progress event', {
                    graphId: graph.instanceId,
                    _status: graph._status,
                    error: error
                });
            } else {
                throw error;
            }
        });
    };

    /**
     * Publish a graph started progress event over AMQP and via Web Hooks.
     *
     * @param {Object} graph
     * @param {Object} options
     * @param {Boolean} options.swallowError
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishGraphStarted = function(graph, options) {
        return this._publishGraphProgress(graph, 'started', options);
    };

    /**
     * Publish a graph finished progress event over AMQP and via Web Hooks.
     *
     * @param {Object} graph
     * @param {String} graphFinishedState
     * @param {Object} options
     * @param {Boolean} options.swallowError
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishGraphFinished = function(
        graph,
        graphFinishedState,
        options
    ) {
        return this._publishGraphProgress(graph, graphFinishedState, options);
    };

    /**
     * Publishes a task started event over AMQP and via Web Hooks
     *
     * @param {Object} task
     * @param {Object} options
     * @param {Boolean} options.swallowError
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishTaskStarted = function(task, options) {
        options = options || {};
        return Promise.try(function() {
            assert.object(task, 'task');
            assert.object(task.context, 'task.context');
            assert.uuid(task.context.graphId, 'task.context.graphId');
        })
        .then(function() {
            return waterline.graphobjects.findOne({ instanceId: task.context.graphId });
        })
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
            if(options.swallowError) {
                logger.error('Error publishing progress event when task started', {
                    taskId: task.instanceId,
                    graphId: task.context.graphId,
                    error: error
                });
            } else {
                throw error;
            }
        });
    };

    /**
     * Publish a task finished progress event over AMQP and via Web Hooks.
     *
     * @param {Object} task
     * @param {String} task.graphId - the unique ID of the graph to which the task belongs
     * @param {String} task.taskId - the unique ID of the task
     * @param {Object} options
     * @param {Boolean} options.swallowError
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishTaskFinished = function(task, options) {
        options = options || {};
        return Promise.try(function() {
            assert.object(task, 'task');
            assert.uuid(task.graphId, 'task.graphId');
            assert.uuid(task.taskId, 'task.taskId');
        })
        .then(function() {
            return waterline.graphobjects.findOne({ instanceId: task.graphId });
        })
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
            if(options.swallowError) {
                logger.error('Error publishing task finished progress event', {
                    taskId: task.taskId,
                    graphId: task.graphId,
                    error: error
                });
            } else {
                throw error;
            }
        });
    };

    /**
     * Publish a task progress event over AMQP and via Web Hooks.
     *
     * @param {String} graphId - graphId
     * @param {String} taskId - taskId
     * @param {Object} taskProgress - task progress information
     * @param {Object} options
     * @param {Boolean} options.swallowError
     * @returns {Promise}
     * @memberOf GraphProgressService
     */
    GraphProgressService.prototype.publishTaskProgress = function(
        graphId,
        taskId,
        taskProgress,
        options
    ) {
        options = options || {};
        return Promise.try(function() {
            assert.uuid(graphId, 'graphId');
            assert.uuid(taskId, 'taskId');
            assert.ok(taskProgress, 'taskProgress');
        })
        .then(function() {
            return waterline.graphobjects.findOne({instanceId: graphId});
        })
        .then(function(graph) {
            var progress = GraphProgress.create(graph, taskProgress.description);
            progress.updateTaskProgress(taskId,
                    _.pick(taskProgress, ['value', 'maximum', 'description']));
            return eventsProtocol.publishProgressEvent(graph.instanceId,
                                                       progress.getProgressEventData());
        })
        .catch(function(error) {
            if(options.swallowError) {
                logger.error('Error publishing task progress event', {
                    taskId: taskId,
                    graphId: graphId,
                    error: error
                });
            } else {
                throw error;
            }
        });
    };

    GraphProgressService.prototype.start = function() {
        return Promise.resolve();
    };

    GraphProgressService.prototype.stop = function() {
        return Promise.resolve();
    };

    return new GraphProgressService();
}

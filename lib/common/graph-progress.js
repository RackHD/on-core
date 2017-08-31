// Copyright © 2017 Dell Inc. or its subsidiaries.  All Rights Reserved.

'use strict';

module.exports = graphProgressFactory;
graphProgressFactory.$provide = 'GraphProgress';
graphProgressFactory.$inject = [
    'Constants',
    '_',
    'Assert'
];

function graphProgressFactory(
    Constants,
    _,
    assert
) {
    /**
     * Creates a new GraphProgress and calculate the graph progress
     * @param graph {Object}
     * @param graphDescription {String}
     * @constructor
     */
    function GraphProgress(graph, graphDescription) {
        assert.object(graph, 'graph');
        assert.string(graphDescription, 'graphDescription');

        this.graph = graph;
        this.data = {
            graphId: graph.instanceId,
            nodeId: graph.node,
            graphName: graph.name || 'Not available',
            status: graph._status,
            progress: {
                description: graphDescription || 'Not available',
            }
        };
        this._calculateGraphProgress();
    }

    /**
     * Get the graph progress
     *
     * @returns {Object}
     */
    GraphProgress.prototype.getProgressEventData = function() {
        return this.data;
    };

    GraphProgress.prototype._calculateGraphProgress = function() {
        var self = this;
        if (self.graph.tasks) {
            self.data.progress.value = self._countNonPengingTask(self.graph.tasks);
            self.data.progress.maximum = _.size(self.graph.tasks);
        }
        if (self.graph._status === Constants.Task.States.Succeeded) {
            self.data.progress.value = self.data.progress.maximum;
        }
        self.data.progress.percentage = self._calculateProgressPercentage(self.data.progress);
    };

    /**
     * Update the task progress
     * @param taskId {String}
     * @param taskProgress {Object}
     */
    GraphProgress.prototype.updateTaskProgress = function(taskId, taskProgress) {
        var self = this;
        self._setTaskProgress(taskId, taskProgress);
        self._calculateTaskProgressPercentage();
    };

    GraphProgress.prototype._setTaskProgress = function(taskId, taskProgress) {
        var self = this;
        var tasks = self.graph.tasks || {};
        var task = tasks[taskId] || {friendlyName: 'Not available'};
        self.data.taskProgress = {
            taskId: taskId,
            taskName: task.friendlyName || 'Not available',
            state: task.state,
            progress: taskProgress
        };
    };

    GraphProgress.prototype._calculateTaskProgressPercentage = function() {
        var self = this;
        self.data.taskProgress.progress.percentage =
            self._calculateProgressPercentage(self.data.taskProgress.progress);
    };

    GraphProgress.prototype._calculateProgressPercentage = function(data) {
        var percentage = 100 * _.round(data.value / data.maximum, 2);
        if (percentage >= 0 && percentage <= 100) {
            percentage = percentage.toString() + '%';
        } else {
            percentage =  'Not available';
        }
        return percentage;
    };

    GraphProgress.prototype._countNonPengingTask = function(tasks) {
        return _.size(_.filter(tasks, function(task) {
            return task.state !== Constants.Task.States.Pending;
        }));
    };

    GraphProgress.create = function(graph, graphDescription) {
        return new GraphProgress(graph, graphDescription);
    };

    return GraphProgress;
}

// Copyright 2017, Dell EMC, Inc.

'use strict';

module.exports = progressFactory;
progressFactory.$provide = 'Progress';
progressFactory.$inject = [
    'Constants',
    '_'
];

function progressFactory(
    Constants,
    _
) {
    function Progress(graph) {
        this.graph = graph || {};
        this.data = {
            graphId: graph.instanceId,
            nodeId: graph.node,
            graphName: graph.name || 'Not available',
            progress: {
                description: 'Not available',
            }
        };
    }

    Progress.prototype.getData = function() {
        return this.data;
    };

    Progress.prototype.setGraphDescription = function(description) {
        this.data.progress.description = description;
    };

    Progress.prototype.calculateGraphProgress = function() {
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

    Progress.prototype.setTaskProgress = function(taskId, taskProgress) {
        var self = this;
        var tasks = self.graph.tasks || {};
        var task = tasks[taskId] || {friendlyName: 'Not available'};
        self.data.taskProgress = {
            taskId: taskId,
            taskName: task.friendlyName || 'Not available',
            progress: taskProgress
        };
    };

    Progress.prototype.calculateTaskProgressPercentage = function() {
        var self = this;
        self.data.taskProgress.progress.percentage =
            self._calculateProgressPercentage(self.data.taskProgress.progress);
    };

    Progress.prototype._calculateProgressPercentage = function(data) {
        var percentage = 100 * _.round(data.value / data.maximum, 2);
        if (percentage >= 0 && percentage <= 100) {
            percentage = percentage.toString() + '%';
        } else {
            percentage =  'Not available';
        }
        return percentage;
    };

    Progress.prototype._countNonPengingTask = function(tasks) {
        return _.size(_.filter(tasks, function(task) {
            return task.state !== Constants.Task.States.Pending;
        }));
    };

    Progress.create = function(graph) {
        return new Progress(graph);
    };

    return Progress;
}

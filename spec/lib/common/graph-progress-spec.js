// Copyright © 2017 Dell Inc. or its subsidiaries.  All Rights Reserved.

'use strict';
describe('GraphProgress', function() {
    var graph;
    var taskId;
    var graphId;
    var graphDescription;
    var taskProgress;
    var progressData;
    var GraphProgress;

    before(function() {
        helper.setupInjector([
            helper.require('/lib/common/graph-progress')
        ]);
        GraphProgress = helper.injector.get('GraphProgress');
    });

    beforeEach(function() {
        taskId = 'taskId';
        graphId = 'graphId';
        graph = {
            instanceId: graphId,
            name: 'test graph name',
            node: 'nodeId',
            _status: 'failed',
            tasks: {}
        };
        graphDescription = 'test graph description';
        graph.tasks[taskId] = {
            friendlyName: 'test task name',
            state: 'pending',
            terminalOnStates: ['succeeded']
        };
        taskProgress = {
            value: 1,
            maximum: 4,
            description: 'test task description'
        };
        progressData = {
            graphId: graphId,
            graphName: 'test graph name',
            nodeId: 'nodeId',
            status: graph._status,
            progress: {
                value: 0,
                maximum: 1,
                percentage: '0%',
                description: graphDescription
            },
            taskProgress: {
                taskId: taskId,
                taskName: 'test task name',
                state: 'pending',
                progress: {
                    value: 1,
                    maximum: 4,
                    percentage: '25%',
                    description: 'test task description'
                },
            }
        };
    });

    it('should get progress without taskProgress', function() {
        var progress = GraphProgress.create(graph, graphDescription);
        var data = progress.getProgressEventData();
        delete progressData.taskProgress;
        expect(data).to.deep.equal(progressData);
    });

    it('should get progress with taskProgress and updated task percentage', function() {
        var progress = GraphProgress.create(graph, graphDescription);
        progress.updateTaskProgress(taskId, taskProgress);
        var data = progress.getProgressEventData();
        expect(data).to.deep.equal(progressData);
    });
});

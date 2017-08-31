// Copyright © 2017 Dell Inc. or its subsidiaries.  All Rights Reserved.

'use strict';
describe('Services.GraphProgress', function() {
    var eventsProtocol;
    var graphProgressService;
    var waterline;
    var graphId;
    var taskId;
    var graph;
    var task;

    helper.before();

    before(function() {
        graphProgressService = helper.injector.get('Services.GraphProgress');
        eventsProtocol = helper.injector.get('Protocol.Events');
        waterline = helper.injector.get('Services.Waterline');
        var uuid = helper.injector.get('uuid');
        graphId = uuid.v4();
        taskId = uuid.v4();
    });

    helper.after();

    beforeEach(function() {
        task = {
            graphId: graphId,
            taskId: taskId
        };

        graph = {
            instanceId: graphId,
            _status: 'running',
            name: 'test graph name',
            node: 'nodeId',
            tasks: {}
        };
        graph.tasks[taskId] = {
            friendlyName: 'test task name',
            state: 'pending',
            terminalOnStates: ['succeeded']
        };
    });

    describe('test publishGraphStarted', function() {
        it('should publish with the events protocol', function() {
            this.sandbox.stub(eventsProtocol, 'publishProgressEvent').resolves();

            var progressData = {
                graphId: graph.instanceId,
                graphName: graph.name,
                nodeId: graph.node,
                status: graph._status,
                progress: {
                    maximum: 1,
                    value: 0,
                    percentage: '0%',
                    description: 'Graph "' + graph.name + '" ' + 'started'
                }
            };

            return graphProgressService.publishGraphStarted(graph, {swallowError: true})
            .then(function() {
                expect(eventsProtocol.publishProgressEvent).to.have.been.calledOnce;
                expect(eventsProtocol.publishProgressEvent)
                    .to.have.been.calledWith(graph.instanceId, progressData);
            });
        });

        it('should throw the Errors', function() {
            var error = new Error('eventsProtocol publishProgressEvent error');
            this.sandbox.stub(eventsProtocol, 'publishProgressEvent').rejects(error);
            var graph = {
                instanceId: 'testgraphid',
                _status: 'succeeded',
                node: 'nodeId',
                name: 'test graph name',
                tasks: {}
            };

            return expect(graphProgressService.publishGraphStarted(graph, {swallowError: false}))
                .to.be.rejectedWith(error);
        });

        it('should swallow the Errors', function() {
            var error = new Error('eventsProtocol publishProgressEvent error');
            this.sandbox.stub(eventsProtocol, 'publishProgressEvent').rejects(error);
            var graph = {
                instanceId: 'testgraphid',
                _status: 'succeeded',
                node: 'nodeId',
                name: 'test graph name',
                tasks: {}
            };

            return expect(graphProgressService.publishGraphStarted(
                graph,
                {swallowError: true}
            )).to.be.fulfilled;
        });
    });

    describe('test publishGraphFinished', function() {
        it('should publish with the events protocol', function() {
            this.sandbox.stub(eventsProtocol, 'publishProgressEvent').resolves();

            graph._status = 'succeeded';
            graph.tasks[taskId].state = 'succeeded';

            var progressData = {
                graphId: graph.instanceId,
                graphName: graph.name,
                nodeId: graph.node,
                status: graph._status,
                progress: {
                    maximum: 1,
                    value: 1,
                    percentage: '100%',
                    description: 'Graph "' + graph.name + '" ' + 'succeeded'
                }
            };

            return graphProgressService.publishGraphFinished(graph, 'succeeded')
            .then(function() {
                expect(eventsProtocol.publishProgressEvent).to.have.been.calledOnce;
                expect(eventsProtocol.publishProgressEvent)
                    .to.have.been.calledWith(graph.instanceId, progressData);
            });
        });

        it('should throw the Errors', function() {
            var error = new Error('eventsProtocol publishProgressEvent error');
            this.sandbox.stub(eventsProtocol, 'publishProgressEvent').rejects(error);
            var graph = {
                instanceId: 'testgraphid',
                _status: 'succeeded',
                node: 'nodeId',
                name: 'test graph name',
                tasks: {}
            };

            return expect(graphProgressService.publishGraphFinished(
                graph,
                'succeeded',
                {swallowError: false}
            )).to.be.rejectedWith(error);
        });

        it('should swallow the Errors', function() {
            var error = new Error('eventsProtocol publishProgressEvent error');
            this.sandbox.stub(eventsProtocol, 'publishProgressEvent').rejects(error);
            var graph = {
                instanceId: 'testgraphid',
                _status: 'succeeded',
                node: 'nodeId',
                name: 'test graph name',
                tasks: {}
            };

            return expect(graphProgressService.publishGraphFinished(
                graph,
                'succeeded',
                {swallowError: true}
            )).to.be.fulfilled;
        });
    });

    describe('test publishTaskStarted', function() {
        var task, progressData, graph;
        before(function() {
            task = {
                instanceId: 'aTaskId',
                context: { graphId: graphId},
                state: 'pending',
                definition: { terminalOnStates: ['succeeded'], friendlyName: 'Test Task' }
            };
            graph = {
                instanceId: graphId,
                name: 'test graph name',
                node: 'nodeId',
                _status: 'running',
                tasks: {
                    'aTaskId': {
                        friendlyName: task.definition.friendlyName,
                        state: task.state,
                        terminalOnStates: ['succeeded']
                    }
                }
            };
            progressData = {
                graphId: graph.instanceId,
                graphName: graph.name,
                nodeId: graph.node,
                status: graph._status,
                progress: {
                    value: 0,
                    maximum: 1,
                    percentage: '0%',
                    description: 'Task "' + task.definition.friendlyName + '" started',
                },
                taskProgress: {
                    taskId: task.instanceId,
                    taskName: task.definition.friendlyName,
                    state: task.state,
                    progress: {
                        value: 0,
                        maximum: 100,
                        percentage: '0%',
                        description: "Task started"
                    }
                }
            };
        });

        it("should publish with the events protocol", function() {
            eventsProtocol.publishProgressEvent = this.sandbox.stub().resolves();
            waterline.graphobjects.findOne = sinon.stub().resolves(graph);
            return graphProgressService.publishTaskStarted(task)
            .then(function(){
                expect(eventsProtocol.publishProgressEvent).to.be.calledOnce;
                expect(eventsProtocol.publishProgressEvent).to.be
                    .calledWith(task.context.graphId, progressData);
            });
        });

        it("should throw the Errors", function() {
            eventsProtocol.publishProgressEvent = this.sandbox.stub().resolves();
            var error = new Error('graphobjects findOne error');
            waterline.graphobjects.findOne = sinon.stub().rejects(error);
            return expect(graphProgressService.publishTaskStarted(task, {swallowError: false}))
                .to.be.rejectedWith(error);
        });

        it("should swallow the Errors", function() {
            eventsProtocol.publishProgressEvent = this.sandbox.stub().resolves();
            var error = new Error('graphobjects findOne error');
            waterline.graphobjects.findOne = sinon.stub().rejects(error);
            return expect(graphProgressService.publishTaskStarted(
                task,
                {swallowError: true}
            )).to.be.fulfilled;
        });
    });

    describe('test publishTaskFinished', function() {
        it('should publish with the events protocol', function() {
            graph.tasks[taskId].state = 'succeeded';

            eventsProtocol.publishProgressEvent = this.sandbox.stub().resolves();
            waterline.graphobjects.findOne = sinon.stub().resolves(graph);

            var taskFriendlyName = 'test task name';
            var progressData = {
                graphId: graph.instanceId,
                graphName: graph.name,
                nodeId: 'nodeId',
                status: graph._status,
                progress: {
                    value: 1,
                    maximum: 1,
                    percentage: '100%',
                    description: 'Task "' + taskFriendlyName + '" finished',
                },
                taskProgress: {
                    taskId: task.taskId,
                    taskName: taskFriendlyName,
                    state: graph.tasks[taskId].state,
                    progress: {
                        value: 100,
                        maximum: 100,
                        percentage: '100%',
                        description: 'Task finished'
                    }
                }
            };

            return graphProgressService.publishTaskFinished(task)
            .then(function() {
                expect(eventsProtocol.publishProgressEvent).to.have.been.calledOnce;
                expect(eventsProtocol.publishProgressEvent)
                    .to.have.been.calledWith(task.graphId, progressData);
            });
        });

        it('should throw the Errors', function() {
            eventsProtocol.publishProgressEvent = this.sandbox.stub().resolves();
            var error = new Error('graphobjects findOne error');
            waterline.graphobjects.findOne = sinon.stub().rejects(error);
            return expect(graphProgressService.publishTaskFinished(task, {swallowError: false}))
                .to.be.rejectedWith(error);
        });

        it('should swallow the Errors', function() {
            eventsProtocol.publishProgressEvent = this.sandbox.stub().resolves();
            var error = new Error('graphobjects findOne error');
            waterline.graphobjects.findOne = sinon.stub().rejects(error);
            return expect(graphProgressService.publishTaskFinished(
                task,
                {swallowError: true}
            )).to.be.fulfilled;
        });
    });

    describe('test publishTaskProgress', function() {
        it('should publish with the events protocol', function () {
            var milestone = {
                value: 1,
                maximum: 4,
                description: 'foo bar'
            };

            waterline.graphobjects.findOne = sinon.stub().resolves(graph);
            eventsProtocol.publishProgressEvent.reset();
            return graphProgressService.publishTaskProgress(graphId, taskId, milestone)
            .then(function(){
                expect(eventsProtocol.publishProgressEvent).to.have.been.calledOnce;
                expect(eventsProtocol.publishProgressEvent.firstCall.args[0]).to.equal(graphId);
                expect(eventsProtocol.publishProgressEvent.firstCall.args[1]).
                    to.have.property('graphId').and.equal(graphId);
                expect(eventsProtocol.publishProgressEvent.firstCall.args[1]).
                    to.have.deep.property('taskProgress.taskId').and.equal(taskId);
                expect(eventsProtocol.publishProgressEvent.firstCall.args[1]).
                    to.have.deep.property('taskProgress.progress.value').and.equal(1);
                expect(eventsProtocol.publishProgressEvent.firstCall.args[1]).
                    to.have.deep.property('taskProgress.progress.maximum').and.equal(4);
                expect(eventsProtocol.publishProgressEvent.firstCall.args[1]).
                    to.have.deep.property('taskProgress.progress.description').and.equal('foo bar');
            });
        });

        it('should throw the Errors', function () {
            var error = new Error('test update graph progress error');
            var milestone = {
                value: 1,
                maximum: 4,
                description: 'foo bar'
            };
            waterline.graphobjects.findOne = sinon.stub().rejects(error);
            eventsProtocol.publishProgressEvent.reset();
            return expect(graphProgressService.publishTaskProgress(
                graphId,
                taskId,
                milestone,
                {swallowError: false}
            )).to.be.rejectedWith(error);
        });

        it('should swallow the Errors', function () {
            var error = new Error('test update graph progress error');
            var milestone = {
                value: 1,
                maximum: 4,
                description: 'foo bar'
            };
            waterline.graphobjects.findOne = sinon.stub().rejects(error);
            eventsProtocol.publishProgressEvent.reset();
            return expect(graphProgressService.publishTaskProgress(
                graphId,
                taskId,
                milestone,
                {swallowError: true}
            )).to.be.fulfilled;
        });
    });
});

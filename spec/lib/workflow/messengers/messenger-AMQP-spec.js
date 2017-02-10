// Copyright 2016, EMC, Inc.

'use strict';

describe('Task/TaskGraph AMQP messenger plugin', function () {
    var taskProtocol;
    var eventsProtocol;
    var taskGraphRunnerProtocol;
    var amqp;
    var waterline;
    var configuration = {
        get: sinon.stub().withArgs('taskgraph-messenger').returns('AMQP')
    };
    var taskProtocolMock = {
        subscribeRun: sinon.stub().resolves(),
        run: sinon.stub().resolves(),
        subscribeCancel: sinon.stub().resolves(),
        cancel: sinon.stub().resolves()
    };
    var eventsProtocolMock = {
        subscribeTaskFinished: sinon.stub().resolves(),
        publishTaskFinished: sinon.stub().resolves(),
        publishProgressEvent: sinon.stub().resolves()
    };
    var taskGraphRunnerProtocolMock = {
        subscribeRunTaskGraph: sinon.stub().resolves(),
        subscribeCancelTaskGraph: sinon.stub().resolves(),
        cancelTaskGraph: sinon.stub().resolves()
    };
    var uuid = require('node-uuid');
    var waterlineMock = {
        graphobjects: {
            findOne: sinon.stub()
        }
    };

    before(function() {
        helper.setupInjector([
            helper.require('/lib/workflow/messengers/messenger-AMQP'),
            helper.di.simpleWrapper(configuration, 'Services.Configuration'),
            helper.di.simpleWrapper(taskProtocolMock, 'Protocol.Task'),
            helper.di.simpleWrapper(eventsProtocolMock, 'Protocol.Events'),
            helper.di.simpleWrapper(taskGraphRunnerProtocolMock, 'Protocol.TaskGraphRunner'),
            helper.di.simpleWrapper(waterlineMock, 'Services.Waterline')
        ]);
        taskProtocol = helper.injector.get('Protocol.Task');
        eventsProtocol = helper.injector.get('Protocol.Events');
        taskGraphRunnerProtocol = helper.injector.get('Protocol.TaskGraphRunner');
        amqp = helper.injector.get('Task.Messengers.AMQP');
        waterline = helper.injector.get('Services.Waterline');
    });

    afterEach(function() {
        _.forEach(taskProtocol, function(method) {
            method.reset();
        });
        _.forEach(eventsProtocol, function(method) {
            method.reset();
        });
        _.forEach(taskGraphRunnerProtocol, function(method) {
            method.reset();
        });
    });

    it('should wrap the task protocol subscribeRun method', function() {
        var callback = function() {};
        return amqp.subscribeRunTask('default', callback)
        .then(function() {
            expect(taskProtocol.subscribeRun).to.have.been.calledOnce;
            expect(taskProtocol.subscribeRun).to.have.been.calledWith('default', callback);
        });
    });

    it('should wrap the task protocol run method', function() {
        return amqp.publishRunTask('default', 'testtaskid', 'testgraphid')
        .then(function() {
            expect(taskProtocol.run).to.have.been.calledOnce;
            expect(taskProtocol.run).to.have.been.calledWith(
                'default',
                { taskId: 'testtaskid', graphId: 'testgraphid' }
            );
        });
    });

    it('should wrap the task protocol subscribeCancel  method', function() {
        var callback = function() {};
        return amqp.subscribeCancelTask(callback)
        .then(function() {
            expect(taskProtocol.subscribeCancel).to.have.been.calledOnce;
            expect(taskProtocol.subscribeCancel).to.have.been.calledWith(callback);
        });
    });

    it('should wrap the task protocol cancel method', function() {
        return amqp.publishCancelTask('testtaskid')
        .then(function() {
            expect(taskProtocol.cancel).to.have.been.calledOnce;
            expect(taskProtocol.cancel).to.have.been.calledWith('testtaskid');
        });
    });

    it('should wrap the events protocol subscribeTaskFinished method', function() {
        var callback = function() {};
        return amqp.subscribeTaskFinished('default', callback)
        .then(function() {
            expect(eventsProtocol.subscribeTaskFinished).to.have.been.calledOnce;
            expect(eventsProtocol.subscribeTaskFinished).to.have.been.calledWith(
                'default',
                callback
            );
        });
    });

    it('should wrap the events protocol publishTaskFinished method', function() {
        return amqp.publishTaskFinished(
            'default', 'testtaskid', 'testgraphid', 'succeeded', null, ['failed', 'timeout'])
        .then(function() {
            expect(eventsProtocol.publishTaskFinished).to.have.been.calledOnce;
            expect(eventsProtocol.publishTaskFinished).to.have.been.calledWith(
                'default', 'testtaskid', 'testgraphid', 'succeeded', null, ['failed', 'timeout']
            );
        });
    });

    it('should wrap the taskGraphRunner protocol subscribeRunTaskGraph method', function() {
        var callback = function() {};
        return amqp.subscribeRunTaskGraph('default', callback)
        .then(function() {
            expect(taskGraphRunnerProtocol.subscribeRunTaskGraph).to.have.been.calledOnce;
            expect(taskGraphRunnerProtocol.subscribeRunTaskGraph)
                .to.have.been.calledWith('default', callback);
        });
    });

    it('should wrap the taskGraphRunner protocol subscribeCancelTaskGraph method', function(){
        var callback = function() {};
        return amqp.subscribeCancelGraph(callback)
        .then(function() {
            expect(taskGraphRunnerProtocol.subscribeCancelTaskGraph).to.have.been.calledOnce;
            expect(taskGraphRunnerProtocol.subscribeCancelTaskGraph)
                .to.have.been.calledWith(callback);
        });
    });

    it('should wrap the taskGraphRunner protocol cancelTaskGraph method', function(){
        return amqp.publishCancelGraph('testgraphid')
        .then(function() {
            expect(taskGraphRunnerProtocol.cancelTaskGraph).to.have.been.calledOnce;
            expect(taskGraphRunnerProtocol.cancelTaskGraph).to.have.been.calledWith('testgraphid');
        });
    });

    it('should return a promise from start method', function() {
        return expect(amqp.start()).to.be.fulfilled;
    });

    describe('Graph progress update', function() {
        var graphId = uuid.v4(),
            taskId = uuid.v4(),
            nodeId = uuid.v4(),
            _progressData,
            progressData,
            graphObject = {
                definition: {
                    friendlyName: 'Test graph'
                },
                tasks: {},
                node: nodeId
            };
            graphObject.tasks[uuid.v4()] = {
                friendlyName: "test task 2",
                state: "succeeded"
            };
            graphObject.tasks[uuid.v4()] = {
                friendlyName: "test task 3",
                state: "pending"
            };
            graphObject.tasks[uuid.v4()] = {
                friendlyName: "test task 4",
                state: "pending"
            };

        beforeEach(function() {
            progressData = {
                graphId: graphId,
                nodeId: nodeId,
                graphName: "Test graph",
                progress: {
                    description: "task completed",
                    value: 2,
                    maximum: 4
                },
                taskProgress: {
                    taskId: taskId,
                    taskName: "test task",
                    progress: {
                        description: "Task completed",
                        value: 100,
                        maximum: 100
                    }
                }
            };
            _progressData = _.cloneDeep(progressData);
            graphObject.tasks[taskId] = {
                friendlyName: "test task",
                state: "succeeded"
            };
            graphObject._status = "running";
        });

        it('should update graph progress normally', function(){
            progressData.taskProgress.progress.percentage = 'any';
            _progressData.progress.percentage = '50%';
            _progressData.taskProgress.progress.percentage = 'any';
            _progressData.taskProgress.progress.maximum = 4;
            _progressData.taskProgress.progress.value = 4;
            graphObject.tasks[taskId]= {options: {totalSteps: 4}};
            waterline.graphobjects.findOne.resolves(graphObject);
            return amqp.publishProgressEvent(graphId, progressData)
            .then(function(){
                expect(eventsProtocol.publishProgressEvent).to.be.calledOnce;
                expect(eventsProtocol.publishProgressEvent)
                    .to.be.calledWith(graphId, _progressData);
                expect(waterline.graphobjects.findOne).to.be.calledOnce;
                expect(waterline.graphobjects.findOne).to.be.calledWith({instanceId: graphId});
            });
        });

        it('should update graph progress and calculate percentage number' +
            ' when graph succeeds', function(){
            waterline.graphobjects.findOne.reset();
            _progressData = _.omit(_progressData, ['graphName', 'graphId']);
            _progressData.progress.maximum = null;
            _progressData.progress.value = null;
            delete _progressData.taskProgress.taskId;
            delete _progressData.nodeId;
            progressData.progress.maximum = 4;
            progressData.progress.value = 4;
            progressData.progress.percentage = '100%';
            progressData.taskProgress.progress.percentage = '100%';
            delete progressData.taskProgress.taskId;
            graphObject._status = "succeeded";
            waterline.graphobjects.findOne.resolves(graphObject);

            return amqp.publishProgressEvent(graphId, _progressData)
            .then(function(){
                expect(eventsProtocol.publishProgressEvent).to.be.calledOnce;
                expect(eventsProtocol.publishProgressEvent).to.be.calledWith(graphId, progressData);
                expect(waterline.graphobjects.findOne).to.be.calledOnce;
                expect(waterline.graphobjects.findOne).to.be.calledWith({instanceId: graphId});
            });
        });

        it('should graph update progress with percentage Not Available' +
           ' if no tasks in the graph', function(){
            waterline.graphobjects.findOne.reset();
            _progressData.progress.maximum = null;
            _progressData.progress.value = null;
            delete _progressData.taskProgress;
            progressData.progress.maximum = null;
            progressData.progress.value = null;
            progressData.progress.percentage = 'Not available';
            delete progressData.taskProgress;
            waterline.graphobjects.findOne.resolves({});
            return amqp.publishProgressEvent(graphId, _progressData)
            .then(function(){
                expect(eventsProtocol.publishProgressEvent).to.be.calledOnce;
                expect(eventsProtocol.publishProgressEvent).to.be.calledWith(graphId, progressData);
                expect(waterline.graphobjects.findOne).to.be.calledOnce;
                expect(waterline.graphobjects.findOne).to.be.calledWith({instanceId: graphId});
            });
        });

        it('should graph update progress without taskProgress', function(){
            waterline.graphobjects.findOne.reset();
            delete _progressData.taskProgress;
            delete progressData.taskProgress;
            progressData.progress.percentage = '50%';
            waterline.graphobjects.findOne.resolves(graphObject);
            return amqp.publishProgressEvent(graphId, _progressData)
            .then(function(){
                expect(eventsProtocol.publishProgressEvent).to.be.calledOnce;
                expect(eventsProtocol.publishProgressEvent).to.be.calledWith(graphId, progressData);
            });
        });

        it('should graph update progress without taskName and graphName', function(){
            waterline.graphobjects.findOne.reset();
            delete _progressData.taskProgress.taskName;
            delete _progressData.graphName;
            progressData.graphName = 'Not available';
            progressData.progress.percentage = '50%';
            progressData.taskProgress.taskName = 'Not available';
            progressData.taskProgress.progress.percentage = '100%';
            waterline.graphobjects.findOne.resolves();
            return amqp.publishProgressEvent(graphId, _progressData)
            .then(function(){
                expect(eventsProtocol.publishProgressEvent).to.be.calledOnce;
                expect(eventsProtocol.publishProgressEvent).to.be.calledWith(graphId, progressData);
            });
        });
    });
});

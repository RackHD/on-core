// Copyright 2016, EMC, Inc.

'use strict';

describe('Task/TaskGraph AMQP messenger plugin', function () {
    var taskProtocol;
    var eventsProtocol;
    var taskGraphRunnerProtocol;
    var amqp;
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
        publishTaskFinished: sinon.stub().resolves()
    };
    var taskGraphRunnerProtocolMock = {
        subscribeRunTaskGraph: sinon.stub().resolves(),
        subscribeCancelTaskGraph: sinon.stub().resolves(),
        cancelTaskGraph: sinon.stub().resolves()
    };

    before(function() {
        helper.setupInjector([
            helper.require('/lib/workflow/messengers/messenger-AMQP'),
            helper.di.simpleWrapper(configuration, 'Services.Configuration'),
            helper.di.simpleWrapper(taskProtocolMock, 'Protocol.Task'),
            helper.di.simpleWrapper(eventsProtocolMock, 'Protocol.Events'),
            helper.di.simpleWrapper(taskGraphRunnerProtocolMock, 'Protocol.TaskGraphRunner'),
        ]);
        taskProtocol = helper.injector.get('Protocol.Task');
        eventsProtocol = helper.injector.get('Protocol.Events');
        taskGraphRunnerProtocol = helper.injector.get('Protocol.TaskGraphRunner');
        amqp = helper.injector.get('Task.Messengers.AMQP');
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
            'default', 'testtaskid', 'testgraphid', 'succeeded', ['failed', 'timeout'])
        .then(function() {
            expect(eventsProtocol.publishTaskFinished).to.have.been.calledOnce;
            expect(eventsProtocol.publishTaskFinished).to.have.been.calledWith(
                'default', 'testtaskid', 'testgraphid', 'succeeded', ['failed', 'timeout']
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
});

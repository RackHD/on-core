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
        subscribeCancelGraph: sinon.stub().resolves(),
        publishCancelGraph: sinon.stub().resolves()
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

    it('subscribeRunTask', function() {
        var callback = function() {};
        return amqp.subscribeRunTask('default', callback)
        .then(function() {
            expect(taskProtocol.subscribeRun).to.have.been.calledOnce;
            expect(taskProtocol.subscribeRun).to.have.been.calledWith('default', callback);
        });
    });

    it('publishRunTask', function() {
        return amqp.publishRunTask('default', 'testtaskid', 'testgraphid')
        .then(function() {
            expect(taskProtocol.run).to.have.been.calledOnce;
            expect(taskProtocol.run).to.have.been.calledWith(
                'default',
                { taskId: 'testtaskid', graphId: 'testgraphid' }
            );
        });
    });

    it('subscribeCancel', function() {
        var callback = function() {};
        return amqp.subscribeCancelTask(callback)
        .then(function() {
            expect(taskProtocol.subscribeCancel).to.have.been.calledOnce;
            expect(taskProtocol.subscribeCancel).to.have.been.calledWith(callback);
        });
    });

    it('publishCancelTask', function() {
        return amqp.publishCancelTask('testtaskid')
        .then(function() {
            expect(taskProtocol.cancel).to.have.been.calledOnce;
            expect(taskProtocol.cancel).to.have.been.calledWith('testtaskid');
        });
    });

    it('subscribeTaskFinished', function() {
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

    it('publishTaskFinished', function() {
        return amqp.publishTaskFinished(
            'default', 'testtaskid', 'testgraphid', 'succeeded', ['failed', 'timeout'])
        .then(function() {
            expect(eventsProtocol.publishTaskFinished).to.have.been.calledOnce;
            expect(eventsProtocol.publishTaskFinished).to.have.been.calledWith(
                'default', 'testtaskid', 'testgraphid', 'succeeded', ['failed', 'timeout']
            );
        });
    });

    it('subscribeRunTaskGraph', function() {
        var callback = function() {};
        return amqp.subscribeRunTaskGraph('default', callback)
        .then(function() {
            expect(taskGraphRunnerProtocol.subscribeRunTaskGraph).to.have.been.calledOnce;
            expect(taskGraphRunnerProtocol.subscribeRunTaskGraph)
                .to.have.been.calledWith('default', callback);
        });
    });

    it('subscribeCancelGraph');

    it('publishCancelGraph');

    it('start', function() {
        return expect(amqp.start()).to.be.fulfilled;
    });
});

// Copyright 2015, EMC, Inc.


'use strict';

describe("TaskGraph Runner protocol functions", function () {
    var testSubscription,
        testMessage,
        messenger,
        taskgraphrunner,
        uuid,
        Constants,
        sampleError = new Error('someError');

    helper.before();

    before(function () {
        taskgraphrunner = helper.injector.get('Protocol.TaskGraphRunner');
        messenger = helper.injector.get('Services.Messenger');
        uuid = helper.injector.get('uuid');
        Constants = helper.injector.get('Constants');
        var Message = helper.injector.get('Message');
        var Subscription = helper.injector.get('Subscription');

        testSubscription = new Subscription({},{});
        testMessage = new Message({},{},{});
        sinon.stub(testMessage);
        sinon.stub(messenger);
    });

    helper.after();

    describe("runTaskGraph", function() {
        it("should publish to runTaskGraph", function() {
            var graphId = uuid.v4();
            messenger.publishInternalEvents.resolves();

            return taskgraphrunner.runTaskGraph(graphId, 'default')
            .then(function() {
                expect(messenger.publishInternalEvents).to.have.been.calledOnce;
                expect(messenger.publishInternalEvents).to.have.been.calledWith(
                    Constants.Protocol.Exchanges.TaskGraphRunner.Name,
                    'methods.runTaskGraph.default',
                    { graphId: graphId }
                );
            });
        });

        it("should receive runTaskGraph results", function() {
            messenger.subscribe.resolves();
            var cb = function () {
                // test
            };

            return taskgraphrunner.subscribeRunTaskGraph('default', cb)
            .then(function() {
                expect(messenger.subscribe).to.have.been.calledOnce;
                expect(messenger.subscribe).to.have.been.calledWith(
                    Constants.Protocol.Exchanges.TaskGraphRunner.Name,
                    'methods.runTaskGraph.default'
                );
                expect(
                    messenger.subscribe.firstCall.args[2].toString()
                ).to.equal(cb.toString());
            });
        });
    });

    describe("cancelTaskGraph", function() {
        it("should subscribe and receive cancelTaskGraph results", function() {
            var graphId = uuid.v4();

            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(graphId,testMessage);
                return Promise.resolve(testSubscription);
            });

            messenger.request.resolves({value:graphId});
            return taskgraphrunner.subscribeCancelTaskGraph(function() {
                return graphId;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.cancelTaskGraph(graphId);
            }).then(function(data) {
                expect(data).to.deep.equal(graphId);
            });
        });

        it("should subscribe and receive cancelTaskGraph failures", function() {
            var graphId = uuid.v4();
            messenger.request.rejects(sampleError);
            return taskgraphrunner.subscribeCancelTaskGraph(function(_graphId) {
                expect(_graphId).to.deep.equal(graphId);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.cancelTaskGraph(graphId);
            }).should.be.rejectedWith(sampleError);
        });
    });
});

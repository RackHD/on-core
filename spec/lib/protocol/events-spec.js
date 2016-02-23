// Copyright 2015, EMC, Inc.


'use strict';

describe("Event protocol subscribers", function () {
    var testSubscription,
        testMessage,
        messenger,
        events;

    helper.before();

    before(function () {
        events = helper.injector.get('Protocol.Events');
        messenger = helper.injector.get('Services.Messenger');
        var Message = helper.injector.get('Message');
        var Subscription = helper.injector.get('Subscription');

        testSubscription = new Subscription({},{});
        testMessage = new Message({},{},{});
        sinon.stub(testMessage);
        sinon.stub(messenger);
    });

    helper.after();

    describe("publish/subscribe TftpSuccess", function () {

        it("should publish and subscribe to TftpSuccess messages", function () {
            //NOTE: no matching internal code to listen for these events
            var nodeId = "507f191e810c19729de860ea", //mongoId format
                data = {foo: 'bar'};
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return events.subscribeTftpSuccess(nodeId, function (_data) {
                expect(_data).to.equal(data);
                return data;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishTftpSuccess(nodeId, data);
            });
        });
    });

    describe("publish/subscribe TftpFailure", function () {

        it("should publish and subscribe to TftpFailure messages", function () {
            //NOTE: no matching internal code to listen for these events
            var nodeId = "507f191e810c19729de860ea", //mongoId format
                data = {foo: 'bar'};
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return events.subscribeTftpFailure(nodeId, function (_data) {
                expect(_data).to.equal(data);
                return data;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishTftpFailure(nodeId, data);
            });
        });
    });

    describe("publish/subscribe HttpResponse", function () {

        it("should publish and subscribe to HttpResponse messages", function () {
            //NOTE: no matching internal code to listen for these events
            var nodeId = "507f191e810c19729de860ea", //mongoId format
                data = {foo: 'bar'};
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return events.subscribeHttpResponse(nodeId, function (_data) {
                expect(_data).to.equal(data);
                return data;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishHttpResponse(nodeId, data);
            });
        });
    });

    describe("publish/subscribe DhcpBoundLease", function () {

        it("should publish and subscribe to DhcpBoundLease messages", function () {
            //NOTE: no matching internal code to listen for these events
            var nodeId = "507f191e810c19729de860ea", //mongoId format
                data = {foo: 'bar'};
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return events.subscribeDhcpBoundLease(nodeId, function (_data) {
                expect(_data).to.equal(data);
                return data;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishDhcpBoundLease(nodeId, data);
            });
        });
    });

    describe("publish/subscribe TaskFinished", function () {
        it("should publish and subscribe to TaskFinished messages", function () {
            var uuid = helper.injector.get('uuid'),
                domain = 'default',
                data = {
                    taskId: uuid.v4(),
                    graphId: uuid.v4(),
                    state: 'succeeded',
                    context: {},
                    terminalOnStates: ['failed', 'timeout']
                };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();

            return events.subscribeTaskFinished(domain, function (_data) {
                expect(_data).to.deep.equal(data);
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishTaskFinished(
                    domain,
                    data.taskId,
                    data.graphId,
                    data.state,
                    data.context,
                    data.terminalOnStates
                );
            });
        });
    });

    describe("publish/subscribe GraphStarted", function () {

        it("should publish and subscribe to GraphStarted messages", function () {
            //NOTE: no matching internal code to listen for these events
            var uuid = helper.injector.get('uuid'),
                graphId = uuid.v4(),
                data = { test: 'data' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return events.subscribeGraphStarted(graphId, function (_data) {
                expect(_data).to.equal(data);
                return data;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishGraphStarted(graphId, data);
            }).then(function (subscription) {
                expect(subscription).to.not.be.ok;
                return events.publishGraphStarted(graphId, undefined);
            });
        });
    });

    describe("publish/subscribe GraphFinished", function () {

        it("should publish and subscribe to GraphFinished messages", function () {
            //NOTE: no matching internal code to listen for these events
            var uuid = helper.injector.get('uuid'),
                graphId = uuid.v4(),
                status = 'testStatus';
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({status:status},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return events.subscribeGraphFinished(graphId, function (_data) {
                expect(_data).to.equal(status);
                return status;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishGraphFinished(graphId, status);
            });
        });
    });

    describe("publish/subscribe SkuAssigned", function () {

        it("should publish and subscribe to SkuAssigned messages", function () {
            //NOTE: no matching internal code to listen for these events
            var nodeId = "507f191e810c19729de860ea", //mongoId format
                skuId = "507f191e810c19729de860eb"; //mongoId format
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({sku:skuId},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return events.subscribeSkuAssigned(nodeId, function (sku) {
                expect(sku).to.equal(skuId);
                return skuId;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishSkuAssigned(nodeId, skuId);
            });
        });
    });

    describe("publish various errors/event", function () {
        it("should publish an ignored error", function () {
            var testError = Error('ignore');
            messenger.request.resolves(testError);
            return events.publishIgnoredError(function(err) {
                expect(err).to.equal(testError);
            });
        });
       it("should publish an unhandled error", function () {
            var testError = Error('unhandled');
            messenger.publish.resolves();
            return events.publishUnhandledError(function(err) {
                expect(err).to.equal(testError);
            });
        });
       it("should publish a blocked event", function () {
            var testError = Error('blockedEvent');
            messenger.publish.resolves();
            return events.publishBlockedEventLoop(function(err) {
                expect(err).to.equal(testError);
            });
        });
    });
});

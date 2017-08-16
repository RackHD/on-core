// Copyright 2015, EMC, Inc.


'use strict';

describe("Event protocol subscribers", function () {
    var testSubscription,
        testMessage,
        messenger,
        events,
        hook;

    var clock;
    var createTime;

    helper.before();

    before(function () {
        events = helper.injector.get('Protocol.Events');
        messenger = helper.injector.get('Services.Messenger');
        hook = helper.injector.get('Services.Hook');
        var Message = helper.injector.get('Message');
        var Subscription = helper.injector.get('Subscription');

        testSubscription = new Subscription({},{});
        testMessage = new Message({},{},{});
    });

    beforeEach(function() {
        this.sandbox.stub(testMessage);
        this.sandbox.stub(messenger, 'request');
        this.sandbox.stub(messenger, 'publish');
        this.sandbox.stub(hook, 'publish').resolves();
        clock = this.sandbox.useFakeTimers(new Date(2011,9,1).getTime());
        createTime = new Date();
    });

    helper.after();

    describe("publish/subscribe TftpSuccess", function () {

        it("should publish and subscribe to TftpSuccess messages", function () {
            //NOTE: no matching internal code to listen for these events
            var nodeId = "507f191e810c19729de860ea", //mongoId format
                data = {foo: 'bar'};
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
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
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
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
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
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
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
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
                    taskName: 'taskName',
                    graphId: uuid.v4(),
                    graphName: 'graphName',
                    state: 'succeeded',
                    error: null,
                    context: {},
                    terminalOnStates: ['failed', 'timeout']
                };
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
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
                    data.taskName,
                    data.graphId,
                    data.graphName,
                    data.state,
                    data.error,
                    data.context,
                    data.terminalOnStates
                );
            });
        });
    });

    describe("publish/subscribe Notification", function () {
        it("should publish and subscribe to NodeNotification messages", function () {
            var nodeId = '57a86b5c36ec578876878294',
                data = {
                    nodeId: nodeId,
                    data: 'test data'
                };
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();

            return events.subscribeNodeNotification(nodeId, function (_data) {
                expect(_data).to.deep.equal(data);
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                events.publishNodeNotification(
                    nodeId,
                    data
                );
                expect(messenger.publish).to.have.been.calledWith(
                    'on.events',
                    'notification.' + nodeId,
                    data
                );
            });
        });

        it("should publish and subscribe to NodeNotification messages without data", function(){
            var nodeId = '57a86b5c36ec578876878294';
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
                callback(testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();

            return events.subscribeNodeNotification(nodeId, function () {
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                events.publishNodeNotification(
                    nodeId
                );
                expect(messenger.publish).to.have.been.calledWith(
                    'on.events',
                    'notification.' + nodeId,
                    ''
                );
            });
        });

        it("should publish and subscribe to BroadcastNotification messages", function () {
            var data = {
                    data: 'test data'
                };
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();

            return events.subscribeBroadcastNotification(function (_data) {
                expect(_data).to.deep.equal(data);
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                events.publishBroadcastNotification(
                    data
                );
                expect(messenger.publish).to.have.been.calledWith(
                    'on.events',
                    'notification',
                    data
                );
            });
        });

        it("should publish and subscribe to BroadcastNotification messages without data", function(){
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
                callback(testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();

            return events.subscribeBroadcastNotification(function () {
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                events.publishBroadcastNotification();
                expect(messenger.publish).to.have.been.calledWith(
                    'on.events',
                    'notification',
                    ''
                );
            });
        });
    });

    describe("publish/subscribe GraphStarted", function () {

        it("should publish and subscribe to GraphStarted messages", function () {
            //NOTE: no matching internal code to listen for these events
            var uuid = helper.injector.get('uuid'),
                graphId = uuid.v4(),
                data = {
                    graphId: graphId,
                    graphName: 'testGraphName',
                    status: 'testStatus'
                },
                nodeId = 'abc';
            messenger.subscribe = this.sandbox.spy(function(a, b, callback) {
                callback(data, testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return events.subscribeGraphStarted(graphId, function (_data) {
                expect(_data).to.equal(data);
                return data;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishGraphStarted(graphId, data, nodeId);
            });
        });
    });

    describe("publish/subscribe GraphFinished", function () {

        it("should publish and subscribe to GraphFinished messages", function () {
            //NOTE: no matching internal code to listen for these events
            var uuid = helper.injector.get('uuid'),
                graphId = uuid.v4(),
                data = {
                    graphId: graphId,
                    graphName: 'testGraphName',
                    status: 'testStatus'
                },
                nodeId = 'abc';
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
                callback(data, testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return events.subscribeGraphFinished(graphId, function (_data) {
                expect(_data).to.equal(data);
                return data;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return events.publishGraphFinished(graphId, data, nodeId);
            });
        });
    });

    describe("publish/subscribe SkuAssigned", function () {

        it("should publish and subscribe to SkuAssigned messages", function () {
            //NOTE: no matching internal code to listen for these events
            var uuid = helper.injector.get('uuid'),
                skuId = uuid.v4(); // uuid format
            var nodeId = "507f191e810c19729de860ea";
            messenger.subscribe = this.sandbox.spy(function(a,b,callback) {
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

    describe("publish node event", function(){
        var testAction = 'discovered',
            testType = 'compute',
            testNodeId,
            testNode = {};
        var routingKey;

        before(function(){
            var uuid = helper.injector.get('uuid');
            testNodeId = uuid.v4();
            var typeId = testNodeId;

            testNode = {
                id: testNodeId,
                type: testType
            };

            routingKey = 'node.discovered.information.' + typeId + '.' + testNodeId;
        });

        it('should publish without additional data', function(){
            messenger.publish.resolves();

            return events.publishNodeEvent(testNode, testAction)
            .then(function(){
                expect(messenger.publish.firstCall).to.have.been.calledWith(
                    'on.events',
                    routingKey,
                    {
                        type: 'node',
                        action: testAction,
                        nodeId: testNodeId,
                        typeId: testNodeId,
                        severity: "information",
                        data: { nodeType: 'compute'},
                        version:'1.0',
                        createdAt: createTime
                    });
                expect(hook.publish).to.have.been.calledOnce;
                expect(hook.publish).to.have.been.calledWith({
                        type: 'node',
                        action: testAction,
                        nodeId: testNodeId,
                        typeId: testNodeId,
                        severity: "information",
                        data: { nodeType: 'compute'},
                        version:'1.0',
                        createdAt: createTime
                    });
            });
        });

        it('should publish with additional data', function(){
            var testData = {
                    "test" : "payload",
                    "for": "publishing"
                };

            messenger.publish.resolves();

            return events.publishNodeEvent(testNode, testAction, testData)
            .then(function(){
                expect(messenger.publish.firstCall).to.have.been.calledWith(
                    'on.events',
                    routingKey,
                    {
                        type: 'node',
                        action: testAction,
                        nodeId: testNodeId,
                        typeId: testNodeId,
                        severity: "information",
                        data: testData,
                        version:'1.0',
                        createdAt: createTime
                    });
            });
        });
    });


    describe("publish node attribute event", function () {
        it('should publish assigned event', function() {
            var oldNode = {id: 'aaa', type: 'compute', sku: ''};
            var newNode = {id: 'aaa', type: 'compute', sku: 'bbb'};
            var typeId = oldNode.id;
            var routingKey = 'node.sku.assigned.information.' + typeId + '.' + oldNode.id;

            messenger.publish.resolves();

            return events.publishNodeAttrEvent(oldNode, newNode, 'sku')
            .then(function () {
                expect(messenger.publish).to.have.been
                .calledWith('on.events', routingKey,
                    { type: 'node',
                      action: 'sku.assigned',
                      nodeId : 'aaa',
                      typeId: 'aaa',
                      severity: "information",
                      data: { nodeType: 'compute'},
                      version:'1.0',
                      createdAt: createTime});
            });
        });

        it('should publish unassigned event', function() {
            var oldNode = {id: 'aaa', type: 'compute', sku: 'bbb'};
            var newNode = {id: 'aaa', type: 'compute', sku: ''};
            var typeId = oldNode.id;
            var routingKey = 'node.sku.unassigned.information.' + typeId + '.' + oldNode.id;

            messenger.publish.resolves();

            return events.publishNodeAttrEvent(oldNode, newNode, 'sku')
            .then(function () {
                expect(messenger.publish).to.have.been
                .calledWith('on.events', routingKey,
                    { type: 'node',
                      action: 'sku.unassigned',
                      nodeId : 'aaa',
                      typeId: 'aaa',
                      severity: "information",
                      data: { nodeType: 'compute'},
                      version:'1.0',
                      createdAt: createTime
                     });
            });
        });

        it('should publish updated event', function() {
            var oldNode = {id: 'aaa', type: 'compute', sku: 'bbb'};
            var newNode = {id: 'aaa', type: 'compute', sku: 'ccc'};
            var typeId = oldNode.id;
            var routingKey = 'node.sku.updated.information.' + typeId + '.' + oldNode.id;

            messenger.publish.resolves();

            return events.publishNodeAttrEvent(oldNode, newNode, 'sku')
            .then(function () {
                expect(messenger.publish).to.have.been
                .calledWith('on.events', routingKey,
                    { type: 'node',
                      action: 'sku.updated',
                      nodeId : 'aaa',
                      typeId: 'aaa',
                      severity: "information",
                      data: { nodeType: 'compute'},
                      version:'1.0',
                      createdAt: createTime
                    });
            });
        });

        it('should not publish event if no sku and no change', function() {
            var oldNode = {id: 'aaa', type: 'compute', sku: ''};
            var newNode = {id: 'aaa', type: 'compute', sku: ''};

            messenger.publish.resolves();

            return events.publishNodeAttrEvent(oldNode, newNode, 'sku')
            .then(function () {
                expect(messenger.publish).to.have.not.been.called;
            });
        });

        it('should not publish event if ids do not match', function() {
            var oldNode = {id: 'aaa', type: 'compute', sku: ''};
            var newNode = {id: 'bbb', type: 'compute', sku: 'abc'};

            messenger.publish.resolves();

            return events.publishNodeAttrEvent(oldNode, newNode, 'sku')
            .then(function () {
                expect(messenger.publish).to.have.not.been.called;
            });
        });
    });

    describe("publish graph progress event", function () {
        it("should publish graph progress event", function () {
            var uuid = helper.injector.get('uuid');
            var nodeId = "aaa";
            var type = 'graph';
            var action = 'progress.updated';
            var data = {
                graphId: uuid.v4(),
                nodeId: nodeId,
                progress: {
                    "percentage": "10%",
                    "description": "anything"
                },
                taskProgress: {
                    taskId: "anything"
                }
            };

            var eventData = {
                type: type,
                action: action,
                nodeId : nodeId,
                typeId: data.graphId,
                severity: "information",
                data: data,
                version:'1.0',
                createdAt: createTime
            };
            messenger.publish.resolves();
            return events.publishProgressEvent(data.graphId, data)
            .then(function () {
                expect(messenger.publish).to.be.calledWith(
                    'on.events',
                    type + '.' + action + '.information.' + data.graphId + '.' + nodeId,
                    eventData);
            });
        });

    });

    describe("publish heartbeat event", function () {
        it("should publish heartbeat event", function () {
            var eventTypeId = 'rackhd.on-tftp';
            var data = {};

            var eventData = {
                type: 'heartbeat',
                action: 'updated',
                nodeId : null,
                typeId: eventTypeId,
                severity: "information",
                data: data,
                version:'1.0',
                createdAt: createTime
            };
            messenger.publish.resolves();
            return events.publishHeartbeatEvent(eventTypeId, data)
            .then(function () {
                expect(messenger.publish.firstCall).to.have.been.calledWith(
                    'on.events',
                    'heartbeat.updated.information.' + eventTypeId,
                    eventData);
            });
        });
    });

    describe("subscribe SEL event", function () {
        it("should subscrbe SEl event", function () {
            var nodeId = "507f191e810c19729de860ea";
            var pollerId = "507f191e810c19729de860ea";
            var callbackStub = this.sandbox.stub();
            return events.subscribeSelEvent('information', pollerId, nodeId, callbackStub)
            .then(function(){
                expect(messenger.subscribe).to.have.been.calledWith(
                    'on.events',
                    'polleralert.sel.updated.information.' + pollerId + '.' + nodeId,
                    callbackStub
                );
            });
        });
    });

});

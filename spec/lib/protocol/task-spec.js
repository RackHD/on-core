// Copyright 2015, EMC, Inc.

'use strict';

describe("Task protocol functions", function() {
    var testSubscription,
        testMessage,
        messenger,
        events,
        task,
        Errors;

    helper.before();

    before(function () {
        task = helper.injector.get('Protocol.Task');
        events = helper.injector.get('Protocol.Events');
        messenger = helper.injector.get('Services.Messenger');
        Errors = helper.injector.get('Errors');
        var Subscription = helper.injector.get('Subscription');
        var Message = helper.injector.get('Message');
        testSubscription = new Subscription({},{});
        testMessage = new Message({},{},{});
        sinon.stub(testMessage);
        sinon.stub(messenger);
        sinon.stub(testSubscription);
        sinon.stub(events);
    });

    helper.after();

    describe("Run", function() {

        it("should subscribe to task.run and receive run events", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                args = 'someArgs';
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:args},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            messenger.request.resolves(args);
            return task.subscribeRun(taskId, function(_data) {
                expect(_data).to.be.ok;
                expect(_data).to.equal(args);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.run(taskId, args);
            });
        });
    });

    describe("Cancel", function() {

        it("should subscribe and receive task.cancel events and error data", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                data = {
                    errName:'testerrname',
                    errMessage:'test message'
                };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            task.subscribeCancel(taskId, function(_data) {
                expect(_data).to.be.an.instanceof(Error);
                expect(_data).to.have.property('message').that.equals(data.errMessage);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.cancel(taskId, data.errName, data.errMessage);
            });
        });

        it("should subscribe to and receive task.cancel events and typed errors", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                data = {
                    errName:Errors.TaskTimeoutError.name,
                    errMessage:'test message'
                };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeCancel(taskId, function(_data) {
                expect(_data).to.be.an.instanceof(Errors.TaskTimeoutError);
                expect(_data).to.have.property('message').that.equals(data.errMessage);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.cancel(taskId, data.errName, data.errMessage);
            });
        });
    });

    describe("requestProfile", function() {
        it("should subscribe and receive requestProfile results", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                testProfile = 'testProfile';
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testProfile},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testProfile});
            testSubscription.dispose.resolves(true);
            return task.subscribeRequestProfile(taskId, function() {
                return testProfile;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.requestProfile(taskId);
            }).then(function(profile) {
                expect(profile).to.equal(testProfile);
            }).then(function() {
                // unsubscribe to clean up after ourselves
                return testSubscription.dispose();
            }).then(function(resolvedUnsubscribe) {
                // verify we unsubscribed correctly
                expect(resolvedUnsubscribe).to.be.ok;
            });
        });

        it("should subscribe and receive requestProfile failure", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                sampleError = new Error('someError');
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.rejects(sampleError);
            testSubscription.dispose.resolves(true);
            return task.subscribeRequestProfile(taskId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.requestProfile(taskId);
            }).should.be.rejectedWith(sampleError)
                .then(function() {
                    // unsubscribe to clean up after ourselves
                    return testSubscription.dispose();
                }).then(function(resolvedUnsubscribe) {
                    // verify we unsubscribed correctly
                    expect(resolvedUnsubscribe).to.be.ok;
                });
        });
    });

    describe("requestProperties", function() {
        it("should subscribe and receive requestProperties results", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                testProperties = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testProperties},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testProperties});
            testSubscription.dispose.resolves(true);
            return task.subscribeRequestProperties(taskId, function() {
                return testProperties;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.requestProperties(taskId);
            }).then(function(properties) {
                expect(properties).to.deep.equal(testProperties);
            }).then(function() {
                // unsubscribe to clean up after ourselves
                return testSubscription.dispose();
            }).then(function(resolvedUnsubscribe) {
                // verify we unsubscribed correctly
                expect(resolvedUnsubscribe).to.be.ok;
            });
        });

        it("should subscribe and receive requestProperties failure", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                sampleError = new Error('someError');
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.rejects(sampleError);
            testSubscription.dispose.resolves(true);
            return task.subscribeRequestProperties(taskId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.requestProperties(taskId);
            }).should.be.rejectedWith(sampleError)
                .then(function() {
                    // unsubscribe to clean up after ourselves
                    return testSubscription.dispose();
                }).then(function(resolvedUnsubscribe) {
                    // verify we unsubscribed correctly
                    expect(resolvedUnsubscribe).to.be.ok;
                });
        });
    });

    describe("requestCommands", function() {
        it("should subscribe and receive requestCommands results", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                testProperties = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testProperties},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testProperties});
            testSubscription.dispose.resolves(true);
            return task.subscribeRequestCommands(taskId, function() {
                return testProperties;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.requestCommands(taskId);
            }).then(function(properties) {
                expect(properties).to.deep.equal(testProperties);
            }).then(function() {
                // unsubscribe to clean up after ourselves
                return testSubscription.dispose();
            }).then(function(resolvedUnsubscribe) {
                // verify we unsubscribed correctly
                expect(resolvedUnsubscribe).to.be.ok;
            });
        });

        it("should subscribe and receive requestCommands failure", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                sampleError = new Error('someError');
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.rejects(sampleError);
            testSubscription.dispose.resolves(true);
            return task.subscribeRequestCommands(taskId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.requestCommands(taskId);
            }).should.be.rejectedWith(sampleError)
                .then(function() {
                    // unsubscribe to clean up after ourselves
                    return testSubscription.dispose();
                }).then(function(resolvedUnsubscribe) {
                    // verify we unsubscribed correctly
                    expect(resolvedUnsubscribe).to.be.ok;
                });
        });
    });

    describe("respondCommands", function() {

         it("should subscribe and receive respondCommands results", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            task.subscribeRespondCommands(taskId, function(data) {
                expect(data).to.deep.equal(testData);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.respondCommands(taskId, testData);
            }).catch(function(err) {
                done(err);
            });
        });

        it("should subscribe and receive respondCommands failure", function() {
            var uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                sampleError = new Error('someError');
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.rejects(sampleError);
            return task.subscribeRequestCommands(taskId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.requestCommands(taskId);
            }).should.be.rejectedWith(sampleError);
        });

    });

    describe("getBootProfile", function() {

        it("should subscribe and receive getBootProfile results", function() {
            var nodeId = "507f191e810c19729de860ea",
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            testSubscription.dispose.resolves(true);
            return task.subscribeGetBootProfile(nodeId, function() {
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.getBootProfile(nodeId, {});
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            }).then(function() {
                // unsubscribe to clean up after ourselves
                return testSubscription.dispose();
            }).then(function(resolvedUnsubscribe) {
                // verify we unsubscribed correctly
                expect(resolvedUnsubscribe).to.be.ok;
            });
        });

        it("should subscribe and receive getBootProfile failures", function() {
            var nodeId = "507f191e810c19729de860ea",
                sampleError = new Error('someError');
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.rejects(sampleError);
            testSubscription.dispose.resolves(true);
            return task.subscribeGetBootProfile(nodeId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.getBootProfile(nodeId);
            }).should.be.rejectedWith(sampleError)
            .then(function() {
                // unsubscribe to clean up after ourselves
                return testSubscription.dispose();
            }).then(function(resolvedUnsubscribe) {
                // verify we unsubscribed correctly
                expect(resolvedUnsubscribe).to.be.ok;
            });
        });
    });

    describe("activeTaskExists", function() {

        it("should subscribe and receive activeTaskExists results", function() {
            var nodeId = "507f191e810c19729de860ea",
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            testSubscription.dispose.resolves(true);
            return task.subscribeActiveTaskExists(nodeId, function() {
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.activeTaskExists(nodeId);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            }).then(function() {
                // unsubscribe to clean up after ourselves
                return testSubscription.dispose();
            }).then(function(resolvedUnsubscribe) {
                // verify we unsubscribed correctly
                expect(resolvedUnsubscribe).to.be.ok;
            });
        });

        it("should subscribe and receive activeTaskExists failures", function() {
            var nodeId = "507f191e810c19729de860ea",
                sampleError = new Error('someError');
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.rejects(sampleError);
            testSubscription.dispose.resolves(true);
            return task.subscribeActiveTaskExists(nodeId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.activeTaskExists(nodeId);
            }).should.be.rejectedWith(sampleError)
                .then(function() {
                    // unsubscribe to clean up after ourselves
                    return testSubscription.dispose();
                }).then(function(resolvedUnsubscribe) {
                    // verify we unsubscribed correctly
                    expect(resolvedUnsubscribe).to.be.ok;
                });
        });
    });

    describe("Event subscriptions", function() {

        it("should subscribe to an HTTP response event", function() {
            var data = {
                    test: 1,
                    data: [1, 2]
                },
                id = "5498a7632b9ef0a8b94307a8";
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeHttpResponse(id, function(_data) {
                expect(_data).to.deep.equal(data);
            })
            .then(function(sub) {
                expect(sub).to.be.ok;
                events.publishHttpResponse(id, data);
            });
        });

        it("should subscribe to a TFTP success event", function() {
            var data = {
                    test: 1,
                    data: [1, 2]
                },
                id = "5498a7632b9ef0a8b94307a8";
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeTftpSuccess(id, function(_data) {
                expect(_data).to.deep.equal(data);
            })
            .then(function(sub) {
                expect(sub).to.be.ok;
                events.publishTftpSuccess(id, data);
            });
        });

        it("should subscribe to a DHCP lease bind event", function() {
            var data = {
                    test: 1,
                    data: [1, 2]
                },
                id = "5498a7632b9ef0a8b94307a8";
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback;
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeDhcpBoundLease(id, function(_data) {
                expect(_data).to.deep.equal(data);
            })
            .then(function(sub) {
                expect(sub).to.be.ok;
                events.publishDhcpBoundLease(id, data);
            });
        });

        // TODO: this test should subscribe to the catch all to know when to timeout
        // in order to speed up execution.
        it("should not subscribe to a response for other identifiers", function() {
            var otherId = "5498a7632b9ef0a8b94307a9",
                id = "5498a7632b9ef0a8b94307a8";
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:otherId},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeHttpResponse(otherId, function () {
                return;
            }).then(function (sub) {
                expect(sub).to.be.ok;
                task.subscribeHttpResponse(id, function() {
                    var err = new Error("Did not expect to receive a message from " +
                    " routing keys not mapped to " + otherId);
                    return;
                })
                .then(function(sub) {
                    expect(sub).to.be.ok;
                    events.publishHttpResponse(otherId, {});
                });
            });
        });
    });

    describe("runIpmiCommand", function() {

        it("should subscribe and receive runIpmiCommand results", function() {
            var uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testCommand = "soSomething",
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeRunIpmiCommand(testUuid, testCommand, function(_data) {
                expect(_data).to.deep.equal(testData);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.publishRunIpmiCommand(testUuid, testCommand, testData);
            });
        });
    });

    describe("ipmiCommandResult", function() {

        it("should subscribe and receive ipmiCommand results", function() {
            var uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testCommand = "soSomething",
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeIpmiCommandResult(testUuid, testCommand, function(_data) {
                expect(_data).to.deep.equal(testData);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.publishIpmiCommandResult(testUuid, testCommand, testData);
            });
        });
    });

    describe("runSNMPCommand", function() {

        it("should subscribe and receive ipmiCommand results", function() {
            var uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeRunSnmpCommand(testUuid, function(_data) {
                expect(_data).to.deep.equal(testData);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.publishRunSnmpCommand(testUuid, testData);
            });
        });
    });

    describe("SNMPCommandResult", function() {

        it("should subscribe and receive snmpCommand results", function() {
            var uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeSnmpCommandResult(testUuid, function(_data) {
                expect(_data).to.deep.equal(testData);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.publishSnmpCommandResult(testUuid, testData);
            });
        });
    });

    describe("MetricResult", function() {

        it("should subscribe and receive metric results", function() {
            var uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testData = { abc: '123.456' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData},{deliveryInfo:{routingKey:'test.key'}});
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeMetricResult(testUuid, 'testmetric', function(_data) {
                expect(_data).to.deep.equal(testData);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.publishMetricResult(testUuid, 'testmetric', testData);
            });
        });
    });

    describe("publishPollerAlert", function() {
        //NOTE: no matching internal code to listen for these events
        it("should publish a poller alert event", function() {
            var data = { foo: 'bar' },
                uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                pollerName = 'sdr';
            messenger.publish.resolves();
            return task.publishPollerAlert(testUuid, pollerName, data);
        });
    });

    describe("requestPollerCache", function() {
        it("should subscribe and receive requestPollerCache results", function() {
            var testWorkitemId = 'somestring',
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData,options:{}},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            testSubscription.dispose.resolves(true);
            return task.subscribeRequestPollerCache(function() {
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.requestPollerCache(testWorkitemId);
            }).then(function(_data) {
                expect(_data).to.deep.equal(testData);
                // unsubscribe to clean up after ourselves
                return testSubscription.dispose();
            }).then(function(resolvedUnsubscribe) {
                // verify we unsubscribed correctly
                expect(resolvedUnsubscribe).to.be.ok;
            });
        });

        it("should subscribe and receive requestPollerCache failures", function() {
            var testWorkitemId = 'somestring',
                sampleError = new Error('someError');
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.rejects(sampleError);
            testSubscription.dispose.resolves(true);
            return task.subscribeRequestPollerCache(function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.requestPollerCache(testWorkitemId);
            }).should.be.rejectedWith(sampleError)
                .then(function() {
                    // unsubscribe to clean up after ourselves
                    return testSubscription.dispose();
                }).then(function(resolvedUnsubscribe) {
                    // verify we unsubscribed correctly
                    expect(resolvedUnsubscribe).to.be.ok;
                });
        });
    });

    describe("AnsibleCommand", function() {

        it("should subscribe and receive ansible command results", function() {
            var uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testData},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeAnsibleCommand(testUuid, function(_data) {
                expect(_data).to.deep.equal(testData);
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.publishAnsibleResult(testUuid, testData);
            });
        });
    });

    describe("Trigger", function() {

        it("should subscribe and receive triggers", function() {
            var uuid = helper.injector.get('uuid'),
                triggerGroup = 'testGroup',
                triggerType = 'testType',
                testUuid = uuid.v4();
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback();
                return Promise.resolve(testSubscription);
            });
            messenger.publish.resolves();
            return task.subscribeTrigger(testUuid, triggerType, triggerGroup, function() {
                return;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return task.publishTrigger(testUuid, triggerType, triggerGroup);
            });
        });
    });
});

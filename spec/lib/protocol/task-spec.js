// Copyright (c) 2015, EMC Corporation


'use strict';

describe("Task protocol functions", function() {
    helper.before();

    before(function () {
        this.events = helper.injector.get('Protocol.Events');
        this.task = helper.injector.get('Protocol.Task');
    });

    helper.after();

    describe("Run", function() {
        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                testSubscription.dispose();
            }
        });

        it("should subscribe to task.run and receive run events", function(done) {
            var self = this,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                args = 'someArgs';

            self.task.subscribeRun(taskId, function(_data) {
                try {
                    expect(_data).to.be.ok;
                    expect(_data).to.equal(args);
                    done();
                } catch(err) {
                    done(err);
                }
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.run(taskId, args);
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe("Cancel", function() {
        var testSubscription;
        afterEach("cancel afterEach", function() {
            if (testSubscription) {
                testSubscription.dispose();
            }
        });

        it("should subscribe to task.cancel and receive cancel events", function(done) {
            var self = this,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                args = 'someArgs';

            self.task.subscribeCancel(taskId, function(_data) {
                try {
                    expect(_data).to.be.ok;
                    expect(_data).to.equal(args);
                    done();
                } catch(err) {
                    done(err);
                }
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.cancel(taskId, args);
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe("requestProfile", function() {
        it("should subscribe and receive requestProfile results", function() {
            var self = this,
                testSubscription,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4();

            return self.task.subscribeRequestProfile(taskId, function() {
                return 'testProfile';
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.requestProfile(taskId);
            }).then(function(profile) {
                expect(profile).to.equal('testProfile');
            }).then(function() {
                // unsubscribe to clean up after ourselves
                return testSubscription.dispose();
            }).then(function(resolvedUnsubscribe) {
                // verify we unsubscribed correctly
                expect(resolvedUnsubscribe).to.be.ok;
            });

        });

        it("should subscribe and receive requestProfile failure", function() {
            var self = this,
                testSubscription,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.task.subscribeRequestProfile(taskId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.requestProfile(taskId);
            }).should.be.rejectedWith(ErrorEvent, 'someError')
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
            var self = this,
                testSubscription,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                testProperties = { abc: '123' };

            return self.task.subscribeRequestProperties(taskId, function() {
                return testProperties;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.requestProperties(taskId);
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
            var self = this,
                testSubscription,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.task.subscribeRequestProperties(taskId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.requestProperties(taskId);
            }).should.be.rejectedWith(ErrorEvent, 'someError')
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
            var self = this,
                testSubscription,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                testProperties = { abc: '123' };

            return self.task.subscribeRequestCommands(taskId, function() {
                return testProperties;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.requestCommands(taskId);
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
            var self = this,
                testSubscription,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.task.subscribeRequestCommands(taskId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.requestCommands(taskId);
            }).should.be.rejectedWith(ErrorEvent, 'someError')
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

        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                testSubscription.dispose();
            }
        });

        it("should subscribe and receive respondCommands results", function(done) {
            var self = this,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                testData = { abc: '123' };

            self.task.subscribeRespondCommands(taskId, function(data) {
                try {
                    expect(data).to.deep.equal(testData);
                    done();
                } catch(err) {
                    done(err);
                }
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;
                return self.task.respondCommands(taskId, testData);
            }).catch(function(err) {
                done(err);
            });
        });

        it("should subscribe and receive respondCommands failure", function() {
            var self = this,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.task.subscribeRequestCommands(taskId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.requestCommands(taskId);
            }).should.be.rejectedWith(ErrorEvent, 'someError');
        });

    });

    describe("getBootProfile", function() {

        it("should subscribe and receive getBootProfile results", function() {
            var testSubscription,
                self = this,
                nodeId = "507f191e810c19729de860ea",
                testData = { abc: '123' };

            return self.task.subscribeGetBootProfile(nodeId, function() {
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.getBootProfile(nodeId, {});
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
            var self = this,
                testSubscription,
                nodeId = "507f191e810c19729de860ea",
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.task.subscribeGetBootProfile(nodeId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.getBootProfile(nodeId);
            }).should.be.rejectedWith(ErrorEvent, 'someError')
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
            var testSubscription,
                self = this,
                nodeId = "507f191e810c19729de860ea",
                testData = { abc: '123' };

            return self.task.subscribeActiveTaskExists(nodeId, function() {
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.activeTaskExists(nodeId);
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
            var self = this,
                testSubscription,
                nodeId = "507f191e810c19729de860ea",
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.task.subscribeActiveTaskExists(nodeId, function() {
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.task.activeTaskExists(nodeId);
            }).should.be.rejectedWith(ErrorEvent, 'someError')
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

        it("should subscribe to an HTTP response event", function(done) {
            var self = this,
                data = {
                    test: 1,
                    data: [1, 2]
                },
                id = "5498a7632b9ef0a8b94307a8";

            self.task.subscribeHttpResponse(id, function(_data) {
                expect(_data).to.deep.equal(data);
                done();
            })
                .then(function(sub) {
                    expect(sub).to.be.ok;
                    self.events.publishHttpResponse(id, data);
                });
        });

        it("should subscribe to a TFTP success event", function(done) {
            var self = this,
                data = {
                    test: 1,
                    data: [1, 2]
                },
                id = "5498a7632b9ef0a8b94307a8";

            self.task.subscribeTftpSuccess(id, function(_data) {
                expect(_data).to.deep.equal(data);
                done();
            })
                .then(function(sub) {
                    expect(sub).to.be.ok;
                    self.events.publishTftpSuccess(id, data);
                });
        });

        it("should subscribe to a DHCP lease bind event", function(done) {
            var self = this,
                data = {
                    test: 1,
                    data: [1, 2]
                },
                id = "5498a7632b9ef0a8b94307a8";

            self.task.subscribeDhcpBoundLease(id, function(_data) {
                expect(_data).to.deep.equal(data);
                done();
            })
                .then(function(sub) {
                    expect(sub).to.be.ok;
                    self.events.publishDhcpBoundLease(id, data);
                });
        });

        // TODO: this test should subscribe to the catch all to know when to timeout
        // in order to speed up execution.
        it("should not subscribe to a response for other identifiers", function(done) {
            var self = this,
                otherId = "5498a7632b9ef0a8b94307a9",
                id = "5498a7632b9ef0a8b94307a8";

            self.task.subscribeHttpResponse(otherId, function () {
                setImmediate(function () {
                    done();
                });
            }).then(function (sub) {
                expect(sub).to.be.ok;
                self.task.subscribeHttpResponse(id, function() {
                    var err = new Error("Did not expect to receive a message from " +
                    " routing keys not mapped to " + otherId);
                    done(err);
                })
                .then(function(sub) {
                    expect(sub).to.be.ok;
                    self.events.publishHttpResponse(otherId, {});
                });
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe("runIpmiCommand", function() {

        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                testSubscription.dispose();
            }
        });

        it("should subscribe and receive runIpmiCommand results", function(done) {
            var self = this,
                uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testCommand = "soSomething",
                testData = { abc: '123' };

            self.task.subscribeRunIpmiCommand(testUuid, testCommand, function(_data) {
                try {
                    expect(_data).to.deep.equal(testData);
                    done();
                } catch (err) {
                    done(err);
                }
            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.publishRunIpmiCommand(testUuid, testCommand, testData);
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe("ipmiCommandResult", function() {

        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                testSubscription.dispose();
            }
        });

        it("should subscribe and receive ipmiCommand results", function(done) {
            var self = this,
                uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testCommand = "soSomething",
                testData = { abc: '123' };

            self.task.subscribeIpmiCommandResult(testUuid, testCommand, function(_data) {
                try {
                    expect(_data).to.deep.equal(testData);
                    done();
                } catch (err) {
                    done(err);
                }

            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.publishIpmiCommandResult(testUuid, testCommand, testData);
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe("runSNMPCommand", function() {
        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                testSubscription.dispose();
            }
        });

        it("should subscribe and receive ipmiCommand results", function(done) {
            var self = this,
                uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testData = { abc: '123' };

            self.task.subscribeRunSnmpCommand(testUuid, function(_data) {
                try {
                    expect(_data).to.deep.equal(testData);
                    done();
                } catch(err) {
                    done(err);
                }
            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.publishRunSnmpCommand(testUuid, testData);
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe("SNMPCommandResult", function() {
        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                testSubscription.dispose();
            }
        });

        it("should subscribe and receive snmpCommand results", function(done) {
            var self = this,
                uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testData = { abc: '123' };

            self.task.subscribeSnmpCommandResult(testUuid, function(_data) {
                try {
                    expect(_data).to.deep.equal(testData);
                    done();
                } catch(err) {
                    done(err);
                }
            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.publishSnmpCommandResult(testUuid, testData);
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe("MetricResult", function() {
        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                testSubscription.dispose();
            }
        });

        it("should subscribe and receive metric results", function(done) {
            var self = this,
                uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testData = { abc: '123' };

            self.task.subscribeMetricResult(testUuid, 'testmetric', function(_data) {
                try {
                    expect(_data).to.deep.equal(testData);
                    done();
                } catch(err) {
                    done(err);
                }
            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.publishMetricResult(testUuid, 'testmetric', testData);
            }).catch(function(err) {
                done(err);
            });
        });
    });

    describe("publishPollerAlert", function() {
        //NOTE: no matching internal code to listen for these events
        it("should publish a poller alert event", function() {
            var self = this,
                data = { foo: 'bar' },
                uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4();

            return self.task.publishPollerAlert(testUuid, data);
        });
    });

    describe("requestPollerCache", function() {
        it("should subscribe and receive requestPollerCache results", function() {
            var testSubscription,
                self = this,
                testWorkitemId = 'somestring',
                testData = { abc: '123' };

            return self.task.subscribeRequestPollerCache(function() {
                return testData;

            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.requestPollerCache(testWorkitemId);
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
            var testSubscription,
                self = this,
                testWorkitemId = 'somestring';

            var sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.task.subscribeRequestPollerCache(function() {
                throw sampleError;

            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.requestPollerCache(testWorkitemId);
            }).should.be.rejectedWith(ErrorEvent, 'someError')
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
        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                testSubscription.dispose();
            }
        });

        it("should subscribe and receive ansible command results", function(done) {
            var self = this,
                uuid = helper.injector.get('uuid'),
                testUuid = uuid.v4(),
                testData = { abc: '123' };

            self.task.subscribeAnsibleCommand(testUuid, function(_data) {
                try {
                    expect(_data).to.deep.equal(testData);
                    done();
                } catch(err) {
                    done(err);
                }
            }).then(function(subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.task.publishAnsibleResult(testUuid, testData);
            }).catch(function(err) {
                done(err);
            });
        });
    });

});

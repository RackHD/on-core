// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Event protocol subscribers", function () {

    helper.before();

    before(function () {
        this.events = helper.injector.get('Protocol.Events');
    });

    helper.after();

    describe("publish/subscribe TftpSuccess", function () {

        var testSubscription;
        afterEach("TftpSuccess afterEach", function () {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should publish and subscribe to TftpSuccess messages", function (done) {
            //NOTE: no matching internal code to listen for these events
            var self = this,
                nodeId = "507f191e810c19729de860ea", //mongoId format
                data = {foo: 'bar'};

            self.events.subscribeTftpSuccess(nodeId, function (_data) {
                try {
                    expect(_data).to.deep.equal(data);
                    done();
                } catch (err) {
                    done(err);
                }
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.events.publishTftpSuccess(nodeId, data);
            }).catch(function (err) {
                done(err);
            });
        });
    });

    describe("publish/subscribe TftpFailure", function () {

        var testSubscription;
        afterEach("TftpFailure afterEach", function () {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should publish and subscribe to TftpFailure messages", function (done) {
            //NOTE: no matching internal code to listen for these events
            var self = this,
                nodeId = "507f191e810c19729de860ea", //mongoId format
                data = {foo: 'bar'};

            self.events.subscribeTftpFailure(nodeId, function (_data) {
                try {
                    expect(_data).to.deep.equal(data);
                    done();
                } catch (err) {
                    done(err);
                }
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.events.publishTftpFailure(nodeId, data);
            }).catch(function (err) {
                done(err);
            });
        });
    });

    describe("publish/subscribe HttpResponse", function () {

        var testSubscription;
        afterEach("HttpResponse afterEach", function () {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should publish and subscribe to HttpResponse messages", function (done) {
            //NOTE: no matching internal code to listen for these events
            var self = this,
                nodeId = "507f191e810c19729de860ea", //mongoId format
                data = {foo: 'bar'};

            self.events.subscribeHttpResponse(nodeId, function (_data) {
                try {
                    expect(_data).to.deep.equal(data);
                    done();
                } catch (err) {
                    done(err);
                }
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.events.publishHttpResponse(nodeId, data);
            }).catch(function (err) {
                done(err);
            });
        });
    });

    describe("publish/subscribe DhcpBoundLease", function () {

        var testSubscription;
        afterEach("DhcpBoundLease afterEach", function () {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should publish and subscribe to DhcpBoundLease messages", function (done) {
            //NOTE: no matching internal code to listen for these events
            var self = this,
                nodeId = "507f191e810c19729de860ea", //mongoId format
                data = {foo: 'bar'};

            self.events.subscribeDhcpBoundLease(nodeId, function (_data) {
                try {
                    expect(_data).to.deep.equal(data);
                    done();
                } catch (err) {
                    done(err);
                }
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.events.publishDhcpBoundLease(nodeId, data);
            }).catch(function (err) {
                done(err);
            });
        });
    });

    describe("publish/subscribe TaskFinished", function () {

        var testSubscription;
        afterEach("DhcpBoundLease afterEach", function () {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should publish and subscribe to TaskFinished messages", function (done) {
            //NOTE: no matching internal code to listen for these events
            var self = this,
                uuid = helper.injector.get('uuid'),
                taskId = uuid.v4(),
                data = {foo: 'bar'};

            self.events.subscribeTaskFinished(taskId, function (_data) {
                try {
                    expect(_data).to.deep.equal(data);
                    done();
                } catch (err) {
                    done(err);
                }
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.events.publishTaskFinished(taskId, data);
            }).catch(function (err) {
                done(err);
            });
        });
    });

    describe("publish/subscribe GraphStarted", function () {

        var testSubscription;
        afterEach("GraphStarted afterEach", function () {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should publish and subscribe to GraphStarted messages", function (done) {
            //NOTE: no matching internal code to listen for these events
            var self = this,
                uuid = helper.injector.get('uuid'),
                graphId = uuid.v4(),
                data = { test: 'data' };

            self.events.subscribeGraphStarted(graphId, function (_data) {
                try {
                    expect(_data).to.deep.equal(data);
                    done();
                } catch (err) {
                    done(err);
                }
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.events.publishGraphStarted(graphId, data);
            }).catch(function (err) {
                done(err);
            });
        });
    });

    describe("publish/subscribe GraphFinished", function () {

        var testSubscription;
        afterEach("GraphFinished afterEach", function () {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should publish and subscribe to GraphFinished messages", function (done) {
            //NOTE: no matching internal code to listen for these events
            var self = this,
                uuid = helper.injector.get('uuid'),
                graphId = uuid.v4(),
                status = 'testStatus';

            self.events.subscribeGraphFinished(graphId, function (_data) {
                try {
                    expect(_data).to.deep.equal(status);
                    done();
                } catch (err) {
                    done(err);
                }
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.events.publishGraphFinished(graphId, status);
            }).catch(function (err) {
                done(err);
            });
        });
    });
});

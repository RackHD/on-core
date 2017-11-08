// Copyright 2015, EMC, Inc.

'use strict';

describe("DHCP protocol functions", function () {
    var testSubscription,
        testMessage,
        testIP = '1.1.1.1',
        testMac = "00:11:22:aa:bb:dd",
        sampleError = new Error('someError'),
        messenger,
        dhcp;
    
    helper.before();

    before(function () {
        dhcp = helper.injector.get('Protocol.Dhcp');        
        messenger = helper.injector.get('Services.Messenger');
        var Message = helper.injector.get('Message');
        var Subscription = helper.injector.get('Subscription');
        
        testSubscription = new Subscription({},{});
        testMessage = new Message({},{},{});
        sinon.stub(testMessage);
    });
    
    beforeEach(function() {
        this.sandbox.stub(messenger, 'request');
    });
 
    helper.after();

    describe("lookupIpLease", function () {
        it("should subscribe and receive lookupIpLease results", function () {
            var testResult = {mac: '00:11:22:aa:bb:cc'};
            messenger.subscribe = sinon.spy(function(a,b,callback,d) {
                callback({value:testIP},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testResult.mac});
            return dhcp.subscribeLookupIpLease(function (_data) {
                expect(_data).to.equal(testIP);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.lookupIpLease(testIP);
            }).then(function (data) {
                expect(data).to.equal("00:11:22:aa:bb:cc");
            });
        });

        it("should subscribe and receive empty lookupIpLease result if there's no value",
            function () {
                messenger.request.resolves(Promise.resolve({value:{}}));
                return dhcp.subscribeLookupIpLease(function (_data) {
                    expect(_data).to.equal(testIP);
                    return;
                }).then(function (subscription) {
                    expect(subscription).to.be.ok;
                    return dhcp.lookupIpLease(testIP);
                }).then(function (data) {
                    expect(data).to.deep.equal({});
                });
            });

        it("should subscribe and receive lookupIpLease failures", function () {
            messenger.request.rejects(sampleError);
            return dhcp.subscribeLookupIpLease(function (_data) {
                expect(_data).to.equal(testIP);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.lookupIpLease(testIP);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("pinMac", function () {
        it("should subscribe and receive pinMac results", function () {
            var testResult = true;
            messenger.subscribe = sinon.spy(function(a,b,callback,d) {
                callback({value:testMac},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves(Promise.resolve({value:testResult}));
            return dhcp.subscribePinMac(function (_data) {
                expect(_data).to.equal(testMac);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.pinMac(testMac);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive pinMac failures", function () {
            messenger.request.rejects(sampleError);
            return dhcp.subscribePinMac(function (_data) {
                expect(_data).to.equal(testMac);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.pinMac(testMac);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("unpinMac", function () {
        it("should subscribe and receive unpinMac results", function () {
            var testResult = true;
            messenger.subscribe = sinon.spy(function(a,b,callback,d) {
                callback({value:testMac},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves(Promise.resolve({value:testResult}));
            return dhcp.subscribeUnpinMac(function (_data) {
                expect(_data).to.equal(testMac);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.unpinMac(testMac);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive unpinMac failures", function () {
            messenger.request.rejects(sampleError);
            return dhcp.subscribeUnpinMac(function (_data) {
                expect(_data).to.equal(testMac);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.unpinMac(testMac);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("unpinIp", function () {
        it("should subscribe and receive unpinIp results", function () {
            var testResult = true;
            messenger.subscribe = sinon.spy(function(a,b,callback,d) {
                callback({value:testIP},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves(Promise.resolve({value:testResult}));
            return dhcp.subscribeUnpinIp(function (_data) {
                expect(_data).to.equal(testIP);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.unpinIp(testIP);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive unpinIp failures", function () {
            messenger.request.rejects(sampleError);
            return dhcp.subscribeUnpinIp(function (_data) {
                expect(_data).to.equal(testIP);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.unpinIp(testIP);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("ipInRange", function () {
        it("should subscribe and receive ipInRange results", function () {
            var testResult = true;
            messenger.subscribe = sinon.spy(function(a,b,callback,d) {
                callback({value:testIP},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves(Promise.resolve({value:testResult}));
            return dhcp.subscribeIpInRange(function (_data) {
                expect(_data).to.equal(testIP);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.ipInRange(testIP);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive ipInRange failures", function () {
            messenger.request.rejects(sampleError);
            return dhcp.subscribeIpInRange(function (_data) {
                expect(_data).to.equal(testIP);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.ipInRange(testIP);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("peekLeaseTable", function () {
        it("should subscribe and receive peekLeaseTable results", function () {
            var testResult = {leases: [1, 2, 3]};
            messenger.subscribe = sinon.spy(function(a,b,callback,d) {
                callback({value:testResult},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves(Promise.resolve({value:testResult}));
            return dhcp.subscribePeekLeaseTable(function () {
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.peekLeaseTable();
            }).then(function (data) {
                expect(data).to.deep.equal(testResult);
            });
        });

        it("should subscribe and receive peekLeaseTable failures", function () {
            messenger.request.rejects(sampleError);
            return dhcp.subscribePeekLeaseTable(function () {
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.peekLeaseTable();
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("removeLease", function () {
        it("should subscribe and receive removeLease results", function () {
            var testResult = true;
            messenger.subscribe = sinon.spy(function(a,b,callback,d) {
                callback({value:testMac},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves(Promise.resolve({value:testResult}));
            return dhcp.subscribeRemoveLease(function (_data) {
                expect(_data).to.equal(testMac);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.removeLease(testMac);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive removeLease failures", function () {
            messenger.request.rejects(sampleError);
            return dhcp.subscribeRemoveLease(function (_data) {
                expect(_data).to.equal(testMac);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.removeLease(testMac);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("removeLeaseByIp", function () {
        it("should subscribe and receive removeLeaseByIp results", function () {
            var testResult = true;
            messenger.subscribe = sinon.spy(function(a,b,callback,d) {
                callback({value:testIP},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves(Promise.resolve({value:testResult}));
            return dhcp.subscribeRemoveLeaseByIp(function (_data) {
                expect(_data).to.equal(testIP);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.removeLeaseByIp(testIP);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive removeLeaseByIp failures", function () {
            messenger.request.rejects(sampleError);
            return dhcp.subscribeRemoveLeaseByIp(function (_data) {
                expect(_data).to.equal(testIP);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return dhcp.removeLeaseByIp(testIP);
            }).should.be.rejectedWith(sampleError);
        });
    });
});


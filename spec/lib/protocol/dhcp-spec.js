// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("DHCP protocol functions", function () {
    var testSubscription;

    helper.before();

    before(function () {
        this.dhcp = helper.injector.get('Protocol.Dhcp');
    });

    afterEach(function () {
        if (testSubscription) {
            return testSubscription.dispose();
        }
    });

    helper.after();

    describe("lookupIpLease", function () {
        it("should subscribe and receive lookupIpLease results", function () {
            var self = this,
                testIP = "1.1.1.1",
                testResult = {mac: '00:11:22:aa:bb:cc'};

            return self.dhcp.subscribeLookupIpLease(function (_data) {
                expect(_data).to.equal(testIP);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.lookupIpLease(testIP);
            }).then(function (data) {
                expect(data).to.equal("00:11:22:aa:bb:cc");
            });
        });

        it("should subscribe and receive empty lookupIpLease result if there's no value",
            function () {
                var self = this,
                    testIP = "1.1.1.1";

                return self.dhcp.subscribeLookupIpLease(function (_data) {
                    expect(_data).to.equal(testIP);
                    return;
                }).then(function (subscription) {
                    expect(subscription).to.be.ok;

                    testSubscription = subscription;
                    return self.dhcp.lookupIpLease(testIP);
                }).then(function (data) {
                    expect(data).to.deep.equal({});
                });
            });

        it("should subscribe and receive lookupIpLease failures", function () {
            var self = this,
                testIP = "1.1.1.1",
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.dhcp.subscribeLookupIpLease(function (_data) {
                expect(_data).to.equal(testIP);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.lookupIpLease(testIP);
            }).should.be.rejectedWith(ErrorEvent, 'someError');
        });
    });

    describe("pinMac", function () {
        it("should subscribe and receive pinMac results", function () {
            var self = this,
                testMac = "00:11:22:aa:bb:dd",
                testResult = true;

            return self.dhcp.subscribePinMac(function (_data) {
                expect(_data).to.equal(testMac);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.pinMac(testMac);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive pinMac failures", function () {
            var self = this,
                testMac = "00:11:22:aa:bb:dd",
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.dhcp.subscribePinMac(function (_data) {
                expect(_data).to.equal(testMac);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.pinMac(testMac);
            }).should.be.rejectedWith(ErrorEvent, 'someError');
        });
    });

    describe("unpinMac", function () {
        it("should subscribe and receive unpinMac results", function () {
            var self = this,
                testMac = "00:11:22:aa:bb:ee",
                testResult = true;

            return self.dhcp.subscribeUnpinMac(function (_data) {
                expect(_data).to.equal(testMac);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.unpinMac(testMac);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive unpinMac failures", function () {
            var self = this,
                testMac = "00:11:22:aa:bb:ee",
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.dhcp.subscribeUnpinMac(function (_data) {
                expect(_data).to.equal(testMac);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.unpinMac(testMac);
            }).should.be.rejectedWith(ErrorEvent, 'someError');
        });
    });

    describe("unpinIp", function () {
        it("should subscribe and receive unpinIp results", function () {
            var self = this,
                testIp = "4.3.2.1",
                testResult = true;

            return self.dhcp.subscribeUnpinIp(function (_data) {
                expect(_data).to.equal(testIp);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.unpinIp(testIp);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive unpinIp failures", function () {
            var self = this,
                testIp = "4.3.2.1",
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.dhcp.subscribeUnpinIp(function (_data) {
                expect(_data).to.equal(testIp);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.unpinIp(testIp);
            }).should.be.rejectedWith(ErrorEvent, 'someError');
        });
    });

    describe("ipInRange", function () {
        it("should subscribe and receive ipInRange results", function () {
            var self = this,
                testIp = "4.3.2.1",
                testResult = true;

            return self.dhcp.subscribeIpInRange(function (_data) {
                expect(_data).to.equal(testIp);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.ipInRange(testIp);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive ipInRange failures", function () {
            var self = this,
                testIp = "4.3.2.1",
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.dhcp.subscribeIpInRange(function (_data) {
                expect(_data).to.equal(testIp);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.ipInRange(testIp);
            }).should.be.rejectedWith(ErrorEvent, 'someError');
        });
    });

    describe("peekLeaseTable", function () {
        it("should subscribe and receive peekLeaseTable results", function () {
            var self = this,
                testResult = {leases: [1, 2, 3]};

            return self.dhcp.subscribePeekLeaseTable(function () {
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.peekLeaseTable();
            }).then(function (data) {
                expect(data).to.deep.equal(testResult);
            });
        });

        it("should subscribe and receive peekLeaseTable failures", function () {
            var self = this,
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.dhcp.subscribePeekLeaseTable(function () {
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.peekLeaseTable();
            }).should.be.rejectedWith(ErrorEvent, 'someError');
        });
    });

    describe("removeLease", function () {
        it("should subscribe and receive removeLease results", function () {
            var self = this,
                testMac = "00:11:22:aa:bb:ee",
                testResult = true;

            return self.dhcp.subscribeRemoveLease(function (_data) {
                expect(_data).to.equal(testMac);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.removeLease(testMac);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive removeLease failures", function () {
            var self = this,
                testMac = "00:11:22:aa:bb:ee",
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.dhcp.subscribeRemoveLease(function (_data) {
                expect(_data).to.equal(testMac);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.removeLease(testMac);
            }).should.be.rejectedWith(ErrorEvent, 'someError');
        });
    });

    describe("removeLeaseByIp", function () {
        it("should subscribe and receive removeLeaseByIp results", function () {
            var self = this,
                testIp = "4.3.2.1",
                testResult = true;

            return self.dhcp.subscribeRemoveLeaseByIp(function (_data) {
                expect(_data).to.equal(testIp);
                return testResult;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.removeLeaseByIp(testIp);
            }).then(function (data) {
                expect(data).to.equal(testResult);
            });
        });

        it("should subscribe and receive removeLeaseByIp failures", function () {
            var self = this,
                testIp = "4.3.2.1",
                sampleError = new Error('someError');

            var ErrorEvent = helper.injector.get('ErrorEvent');

            return self.dhcp.subscribeRemoveLeaseByIp(function (_data) {
                expect(_data).to.equal(testIp);
                throw sampleError;
            }).then(function (subscription) {
                expect(subscription).to.be.ok;

                testSubscription = subscription;
                return self.dhcp.removeLeaseByIp(testIp);
            }).should.be.rejectedWith(ErrorEvent, 'someError');
        });
    });

});
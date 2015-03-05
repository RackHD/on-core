// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Lookup Service', function () {
    var lookupService, dhcpProtocol, MacAddress, Errors, waterline;

    helper.before();

    before(function () {
        lookupService = helper.injector.get('Services.Lookup');
        waterline = helper.injector.get('Services.Waterline');
        dhcpProtocol = helper.injector.get('Protocol.Dhcp');
        MacAddress = helper.injector.get('MacAddress');
        Errors = helper.injector.get('Errors');
    });

    afterEach(function () {
        if (this.subscription) {
            this.subscription.dispose();
        }
    });

    helper.after();

    describe('macAddressToNodeId', function () {
        var macAddressToNodeStub;

        before('macAddressToNodeId before', function () {
            macAddressToNodeStub = sinon.stub(lookupService, 'macAddressToNode');
        });

        beforeEach('macAddressToNodeId beforeEach', function () {
            macAddressToNodeStub.reset();
        });

        after('macAddressToNodeId after', function () {
            macAddressToNodeStub.restore();
        });

        it('macAddressToNodeId should return a LookupError if there is no node', function () {
            macAddressToNodeStub.resolves(null);

            return lookupService.macAddressToNodeId('08:00:27:7a:c0:00').should.be.rejectedWith(
                Errors.LookupError,
                'Unable to locate node via MAC address.');
        });
    });
    describe("macAddressToNode", function () {
        var findByIdentifierStub;
        var testNode = {
            id: '123456',
            name: 'testNode'
        };
        before("macAddressToNode before", function () {
            findByIdentifierStub = sinon.stub(waterline.nodes, 'findByIdentifier')
                .returns(Q.resolve(testNode));
        });
        beforeEach("macAddressToNode beforeEach", function () {
            findByIdentifierStub.reset();
        });
        after("macAddressToNode after", function () {
            findByIdentifierStub.restore();
        });
        it("should look up a node using the macaddress", function () {
            return lookupService.macAddressToNode('08:00:27:7a:c0:00')
                .then(function (node) {
                    expect(node).to.deep.equal(testNode);
                });
        });
    });
    describe("ipAddressToMacAddress", function () {
        var lookupIpLeaseStub;
        before("ipAddressToMacAddress before", function () {
            lookupIpLeaseStub = sinon.stub(dhcpProtocol, 'lookupIpLease')
                .returns(Q.resolve('11:22:33:44:55:66'));
        });
        beforeEach("ipAddressToMacAddress beforeEach", function () {
            lookupIpLeaseStub.reset();
            lookupService._ipAddressToMacAddressCache.reset();
        });
        after("ipAddressToMacAddress after", function () {
            lookupIpLeaseStub.restore();
        });

        it("should lookup a macaddress from an IP address", function () {
            return lookupService.ipAddressToMacAddress('1.2.3.4')
                .then(function (macaddress) {
                    expect(macaddress).to.equal('11:22:33:44:55:66');
                    expect(lookupIpLeaseStub).to.have.been.calledWith('1.2.3.4');
                });
        });
        it("should attempt cache lookup macaddress before using protocol", function () {
            //pre set up the cache
            lookupService._ipAddressToMacAddressCache.set('9.8.7.6', 'aa:bb:cc:11:22:33');
            return lookupService.ipAddressToMacAddress('9.8.7.6')
                .then(function (macaddress) {
                    expect(macaddress).to.equal('aa:bb:cc:11:22:33');
                    expect(lookupIpLeaseStub).to.not.have.been.called;
                });
        });
    });
    describe("macAddressToNodeId", function () {
        var findByIdentifierStub;
        before("macAddressToNodeId before", function () {
            findByIdentifierStub = sinon.stub(waterline.nodes, 'findByIdentifier');
        });
        beforeEach("macAddressToNodeId beforeEach", function () {
            findByIdentifierStub.reset();
            lookupService._macToNodeIdCache.reset();
        });
        after("macAddressToNodeId after", function () {
            findByIdentifierStub.restore();
        });
        it("should look up a node using the macaddress", function () {
            findByIdentifierStub.returns(Q.resolve({
                id: '123456',
                name: 'testNode'
            }));
            return lookupService.macAddressToNodeId('08:00:27:7a:c0:00')
                .then(function (nodeId) {
                    expect(nodeId).to.equal('123456');
                    expect(findByIdentifierStub).to.have.been.calledWith('08:00:27:7a:c0:00');
                });
        });
        it("should use internal cache over calling waterline", function () {
            var testNodeId = '123456789';
            var testMacAddr = '44:55:66:aa:bb:cc';
            lookupService._macToNodeIdCache.set(testMacAddr, testNodeId);

            return lookupService.macAddressToNodeId(testMacAddr)
                .then(function (nodeId) {
                    expect(nodeId).to.equal(testNodeId);
                    expect(findByIdentifierStub).to.not.have.been.called;
                });
        });
    });

    describe("ipAddressToNode", function () {
        var findByIdentifierStub;
        var lookupIpLeaseStub;
        before("ipAddressToNode before", function () {
            findByIdentifierStub = sinon.stub(waterline.nodes, 'findByIdentifier');
            lookupIpLeaseStub = sinon.stub(dhcpProtocol, 'lookupIpLease');
        });
        beforeEach("ipAddressToNode beforeEach", function () {
            findByIdentifierStub.reset();
            lookupIpLeaseStub.reset();
            // reset internal caches
            lookupService._macToNodeIdCache.reset();
            lookupService._ipAddressToMacAddressCache.reset();
        });
        after("ipAddressToNode after", function () {
            findByIdentifierStub.restore();
            lookupIpLeaseStub.restore();
        });
        it('should look up an ip address to a node', function () {
            var testIP = "11.23.13.14";
            var testMac = "de:ad:be:ef:11:22";
            var testNode = {
                id: '123456',
                name: 'testNode'
            };
            lookupIpLeaseStub.returns(Q.resolve(testMac));
            findByIdentifierStub.returns(Q.resolve(testNode));

            return lookupService.ipAddressToNode(testIP)
                .then(function (node) {
                    expect(node).to.deep.equal(testNode);
                    expect(lookupIpLeaseStub).to.have.been.calledWith(testIP);
                    expect(findByIdentifierStub).to.have.been.calledWith(testMac);
                });
        });
    });

    describe("ipAddressToNodeId", function () {
        var findByIdentifierStub;
        var lookupIpLeaseStub;
        before("ipAddressToNodeId before", function () {
            findByIdentifierStub = sinon.stub(waterline.nodes, 'findByIdentifier');
            lookupIpLeaseStub = sinon.stub(dhcpProtocol, 'lookupIpLease');
        });
        beforeEach("ipAddressToNodeId beforeEach", function () {
            findByIdentifierStub.reset();
            lookupIpLeaseStub.reset();
            // reset internal caches
            lookupService._macToNodeIdCache.reset();
            lookupService._ipAddressToMacAddressCache.reset();
        });
        after("ipAddressToNodeId after", function () {
            findByIdentifierStub.restore();
            lookupIpLeaseStub.restore();
        });
        it('should look up an ip address to a node ID', function () {
            var testIP = "11.23.13.14";
            var testMac = "de:ad:be:ef:11:22";
            var testNode = {
                id: '123456',
                name: 'testNode'
            };
            lookupIpLeaseStub.returns(Q.resolve(testMac));
            findByIdentifierStub.returns(Q.resolve(testNode));

            return lookupService.ipAddressToNodeId(testIP)
                .then(function (nodeId) {
                    expect(nodeId).to.equal('123456');
                    expect(lookupIpLeaseStub).to.have.been.calledWith(testIP);
                    expect(findByIdentifierStub).to.have.been.calledWith(testMac);
                });
        });
        it('should return undefined if the node is unknown', function () {
            var testIP = "11.23.13.14";
            var testMac = "de:ad:be:ef:11:22";
            lookupIpLeaseStub.returns(Q.resolve(testMac));
            findByIdentifierStub.returns(Q.resolve(null));

            return lookupService.ipAddressToNodeId(testIP)
                .then(function (nodeId) {
                    expect(nodeId).to.be.undefined;
                    expect(lookupIpLeaseStub).to.have.been.calledWith(testIP);
                    expect(findByIdentifierStub).to.have.been.calledWith(testMac);
                });
        });
    });

    describe("ipAddressToMacAddressMiddleware", function () {
        var lookupIpLeaseStub;
        before("ipAddressToMacAddressMiddleware before", function () {
            lookupIpLeaseStub = sinon.stub(dhcpProtocol, 'lookupIpLease');

        });
        beforeEach("ipAddressToMacAddressMiddleware beforeEach", function () {
            lookupIpLeaseStub.reset();
            // reset internal caches
            lookupService._macToNodeIdCache.reset();
            lookupService._ipAddressToMacAddressCache.reset();

        });
        after("ipAddressToMacAddressMiddleware after", function () {
            lookupIpLeaseStub.restore();
        });
        it("should annotate macaddress onto the request using req.ip", function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();

            var testMac = '11:22:33:44:55:66';
            lookupIpLeaseStub.returns(Q.resolve(testMac));

            var req = {
                ip: '2.3.4.5'
            };
            var res = {};
            var next = function () {
                expect(req.macaddress).to.equal(testMac);
                expect(req.macAddress).to.equal(testMac);
                done();
            };

            middleware(req, res, next);
        });
        it("should annotate macaddress onto the request using req._remoteAddress", function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();
            var testMac = '11:22:33:44:55:66';
            lookupIpLeaseStub.returns(Q.resolve(testMac));
            var req = {
                _remoteAddress: '2.3.4.5'
            };
            var res = {};
            var next = function () {
                expect(req.macaddress).to.equal(testMac);
                expect(req.macAddress).to.equal(testMac);
                done();
            };
            middleware(req, res, next);
        });
        it("should annotate macaddress onto the request using req.connection", function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();
            var testMac = '11:22:33:44:55:66';
            lookupIpLeaseStub.returns(Q.resolve(testMac));
            var req = {
                connection: {
                    remoteAddress: '2.3.4.5'
                }
            };

            var res = {};
            var next = function () {
                expect(req.macaddress).to.equal(testMac);
                expect(req.macAddress).to.equal(testMac);
                done();
            };
            middleware(req, res, next);
        });
        it("should throw error is IP address can't be found on request", function() {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();

            expect(function() {
                middleware({}, {}, function() {});
            }).to.throw("Violated isIP constraint");
        });
    });
});

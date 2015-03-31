// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Lookup Service', function () {
    var lookupService, leaseCache, MacAddress, Errors, waterline;

    helper.before();

    before("Lookup Service before", function () {
        lookupService = helper.injector.get('Services.Lookup');
        waterline = helper.injector.get('Services.Waterline');
        leaseCache = helper.injector.get('DhcpLeaseCache');
        MacAddress = helper.injector.get('MacAddress');
        Errors = helper.injector.get('Errors');

        sinon.stub(waterline.nodes, 'findByIdentifier');
        sinon.stub(leaseCache, 'getLeaseByIp');
    });

    beforeEach("Lookup Service beforeEach", function() {
        waterline.nodes.findByIdentifier.reset();
        leaseCache.getLeaseByIp.reset();

        // reset internal caches
        lookupService._macToNodeIdCache.reset();
        lookupService._ipAddressToMacAddressCache.reset();
    });

    afterEach("Lookup Service afterEach", function () {
        if (this.subscription) {
            this.subscription.dispose();
        }
    });

    helper.after(function() {
        waterline.nodes.findByIdentifier.restore();
        leaseCache.getLeaseByIp.restore();
    });

    describe('macAddressToNodeId', function () {
        before('macAddressToNodeId before', function () {
            sinon.stub(lookupService, 'macAddressToNode');
        });

        beforeEach('macAddressToNodeId beforeEach', function() {
            lookupService.macAddressToNode.reset();
        });

        after('macAddressToNodeId after', function () {
            lookupService.macAddressToNode.restore();
        });

        it('macAddressToNodeId should return a LookupError if there is no node', function () {
            lookupService.macAddressToNode.resolves(null);

            return lookupService.macAddressToNodeId('08:00:27:7a:c0:00').should.be.rejectedWith(
                Errors.LookupError, 'Unable to locate node via MAC address.');
        });
    });

    describe('macAddressToNode', function() {
        it("should look up a node using the macaddress", function () {
            var testNode = {
                id: '123456',
                name: 'testNode'
            };
            waterline.nodes.findByIdentifier.resolves(testNode);
            return lookupService.macAddressToNode('08:00:27:7a:c0:00')
                .then(function (node) {
                    expect(node).to.deep.equal(testNode);
                });
        });

        it("should look up a node using the macaddress", function () {
            waterline.nodes.findByIdentifier.resolves({
                id: '123456',
                name: 'testNode'
            });
            return lookupService.macAddressToNodeId('08:00:27:7a:c0:00')
                .then(function (nodeId) {
                    expect(nodeId).to.equal('123456');
                    expect(waterline.nodes.findByIdentifier)
                        .to.have.been.calledWith('08:00:27:7a:c0:00');
                });
        });

        it("should use internal cache over calling waterline", function () {
            var testNodeId = '123456789';
            var testMacAddr = '44:55:66:aa:bb:cc';
            lookupService._macToNodeIdCache.set(testMacAddr, testNodeId);

            return lookupService.macAddressToNodeId(testMacAddr)
                .then(function (nodeId) {
                    expect(nodeId).to.equal(testNodeId);
                    expect(waterline.nodes.findByIdentifier).to.not.have.been.called;
                });
        });
    });

    describe("ipAddressToMacAddress", function () {
        it("should return null if there is no lease", function() {
            leaseCache.getLeaseByIp.resolves([]);
            return expect(lookupService.ipAddressToMacAddress('127.0.0.1')).to.become(null);
        });

        it("should lookup a macaddress from an IP address", function () {
            leaseCache.getLeaseByIp.resolves({
                macAddress: '11:22:33:44:55:66',
                ip: '1.2.3.4'
            });
            return lookupService.ipAddressToMacAddress('1.2.3.4')
                .then(function (macaddress) {
                    expect(macaddress).to.equal('11:22:33:44:55:66');
                    expect(leaseCache.getLeaseByIp).to.have.been.calledWith('1.2.3.4');
                });
        });

        it("should attempt cache lookup macaddress before using protocol", function () {
            //pre set up the cache
            lookupService._ipAddressToMacAddressCache.set('9.8.7.6', 'aa:bb:cc:11:22:33');
            return lookupService.ipAddressToMacAddress('9.8.7.6')
                .then(function (macaddress) {
                    expect(macaddress).to.equal('aa:bb:cc:11:22:33');
                    expect(leaseCache.getLeaseByIp).to.not.have.been.called;
                });
        });
    });

    describe("ipAddressToNode", function () {
        it('should look up an ip address to a node', function () {
            var testIP = "11.23.13.14";
            var testMac = "de:ad:be:ef:11:22";
            var testNode = {
                id: '123456',
                name: 'testNode'
            };
            leaseCache.getLeaseByIp.resolves({
                macAddress: testMac,
                ip: testIP
            });
            waterline.nodes.findByIdentifier.resolves(testNode);

            return lookupService.ipAddressToNode(testIP)
                .then(function (node) {
                    expect(node).to.deep.equal(testNode);
                    expect(leaseCache.getLeaseByIp).to.have.been.calledWith(testIP);
                    expect(waterline.nodes.findByIdentifier).to.have.been.calledWith(testMac);
                });
        });
    });

    describe("ipAddressToNodeId", function () {
        it('should look up an ip address to a node ID', function () {
            var testIP = "11.23.13.14";
            var testMac = "de:ad:be:ef:11:22";
            var testNode = {
                id: '123456',
                name: 'testNode'
            };
            leaseCache.getLeaseByIp.resolves({
                macAddress: testMac,
                ip: testIP
            });
            waterline.nodes.findByIdentifier.resolves(testNode);

            return lookupService.ipAddressToNodeId(testIP)
                .then(function (nodeId) {
                    expect(nodeId).to.equal('123456');
                    expect(leaseCache.getLeaseByIp).to.have.been.calledWith(testIP);
                    expect(waterline.nodes.findByIdentifier).to.have.been.calledWith(testMac);
                });
        });
        it('should return undefined if the node is unknown', function () {
            var testMac = "de:ad:be:ef:11:22";
            var testIP = "11.23.13.14";
            leaseCache.getLeaseByIp.resolves({
                macAddress: testMac,
                ip: testIP
            });
            waterline.nodes.findByIdentifier.resolves(null);

            return lookupService.ipAddressToNodeId(testIP)
                .then(function (nodeId) {
                    expect(nodeId).to.be.null;
                    expect(leaseCache.getLeaseByIp).to.have.been.calledWith(testIP);
                    expect(waterline.nodes.findByIdentifier).to.have.been.calledWith(testMac);
                });
        });
    });

    describe("ipAddressToMacAddressMiddleware", function () {
        it("should annotate macaddress onto the request using req.ip", function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();

            var testMac = '11:22:33:44:55:66';
            leaseCache.getLeaseByIp.resolves({
                macAddress: testMac
            });

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
            leaseCache.getLeaseByIp.resolves({
                macAddress: testMac
            });
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
            leaseCache.getLeaseByIp.resolves({
                macAddress: testMac
            });
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

// Copyright 2015, EMC, Inc.


'use strict';

describe('Lookup Service', function () {
    var lookupService, MacAddress, Errors, waterline;

    var lookup = [{
        ipAddress: '127.0.0.1',
        macAddress: '00:11:22:33:44:55',
        node: 'node'
    }];

    var noNode = [
        {
            ipAddress: '127.0.0.1',
            macAddress: '00:11:22:33:44:55'
        }
    ];

    var node = {
        id: 'node'
    };

    helper.before();

    before('Lookup Service before', function () {
        lookupService = helper.injector.get('Services.Lookup');
        waterline = helper.injector.get('Services.Waterline');
        MacAddress = helper.injector.get('MacAddress');
        Errors = helper.injector.get('Errors');
    });

    helper.after();

    describe('Node ID Cache', function () {
        var spy1 = sinon.spy(),
            spy2 = sinon.spy();

        function assertEmptyNodeIdCacheObject() {
            expect(lookupService.nodeIdCache).to.be.ok;
            expect(lookupService.nodeIdCache.length).to.equal(0);
        }

        it('should start with an empty nodeCache', function () {
            assertEmptyNodeIdCacheObject();
        });

        it('should allow multple simultaneous cache checks', function () {
            expect(lookupService.checkNodeIdCache('testAddress')).to.be.null;
            lookupService.checkNodeIdCache('testAddress').then(spy1, spy1);
            lookupService.checkNodeIdCache('testAddress').then(spy2, spy2);
        });

        it('should resolve pending cache checks once a value is assigned', function (done) {
            lookupService.assignNodeIdCache('testAddress', 'nodeId');
            setTimeout(function () {
                expect(spy1.called).to.be.ok;
                expect(spy2.called).to.be.ok;
                done();
            }, 0);
        });

        it('should immediately resolve from cache', function (done) {
            lookupService.checkNodeIdCache('testAddress').then(function (nodeId) {
                expect(nodeId).to.equal('nodeId');
                done();
            }, done);
        });

        it('should be able to be cleared and reset', function () {
            lookupService.clearNodeIdCache('testAddress');
            expect(lookupService.nodeIdCache.peek('testAddress')).to.be.null;
            lookupService.resetNodeIdCache();
            assertEmptyNodeIdCacheObject();
        });
    });

    describe('macAddressToNodeId', function () {
        beforeEach(function () {
          lookupService.resetNodeIdCache();
        });

        it('should call findByTerm with macAddress', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(lookup);

            return lookupService.macAddressToNodeId('127.0.0.1').then(function (result) {
                expect(result).to.equal(lookup[0].node);
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.macAddressToNodeId('00:11:22:33:44:55')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
            });
        });

        it('should reject with NotFoundError if no node association exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(noNode);

            return expect(
                lookupService.macAddressToNodeId('00:11:22:33:44:55')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
            });
        });
    });

    describe('macAddressToNode', function() {
        it('should call findByTerm with macAddress', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(lookup),
                needOneById = this.sandbox.stub(waterline.nodes, 'needOneById').resolves(node);

            return lookupService.macAddressToNode('00:11:22:33:44:55').then(function (result) {
                expect(result).to.equal(node);
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
                expect(needOneById).to.have.been.calledWith('node');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.macAddressToNode('00:11:22:33:44:55')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
            });
        });

        it('should reject with NotFoundError if no node association exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(noNode);

            return expect(
                lookupService.macAddressToNode('00:11:22:33:44:55')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
            });
        });

        it('should reject with NotFoundError if no node record exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(lookup),
                needOneById = this.sandbox.stub(waterline.nodes, 'needOneById').rejects(
                    new Errors.NotFoundError()
                );

            return expect(
                lookupService.macAddressToNode('00:11:22:33:44:55')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
                expect(needOneById).to.have.been.calledWith('node');
            });
        });
    });

    describe('ipAddressToMacAddress', function () {
        it('should call findByTerm with ipAddress', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(lookup);

            return lookupService.ipAddressToMacAddress('127.0.0.1').then(function (result) {
                expect(result).to.equal(lookup[0].macAddress);
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.ipAddressToMacAddress('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });
    });

    describe('ipAddressToNode', function () {
        it('should call findByTerm with ipAddress', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(lookup),
                needOneById = this.sandbox.stub(waterline.nodes, 'needOneById').resolves(node);

            return lookupService.ipAddressToNode('127.0.0.1').then(function (result) {
                expect(result).to.equal(node);
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
                expect(needOneById).to.have.been.calledWith('node');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.ipAddressToNode('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no node association exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(noNode);

            return expect(
                lookupService.ipAddressToNode('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no node record exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(lookup),
                needOneById = this.sandbox.stub(waterline.nodes, 'needOneById').rejects(
                    new Errors.NotFoundError()
                );

            return expect(
                lookupService.ipAddressToNode('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
                expect(needOneById).to.have.been.calledWith('node');
            });
        });
    });

    describe('ipAddressToNodeId', function () {
        beforeEach(function () {
          lookupService.resetNodeIdCache();
        });

        it('should call findByTerm with ipAddress', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(lookup);

            return lookupService.ipAddressToNodeId('127.0.0.1').then(function (result) {
                expect(result).to.equal(lookup[0].node);
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.ipAddressToNodeId('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no node association exists', function() {
            var findByTerm = this.sandbox.stub(waterline.lookups, 'findByTerm').resolves(noNode);

            return expect(
                lookupService.ipAddressToNodeId('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });
    });

    describe('ipAddressToMacAddressMiddleware', function () {
        it('should assign macaddress to req with req.ip', function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();

            this.sandbox.stub(lookupService, 'ipAddressToMacAddress').resolves('00:11:22:33:44:55');

            var req = { ip: '10.1.1.1' },
                next = function () {
                    expect(req.macaddress).to.equal('00:11:22:33:44:55');
                    expect(req.macAddress).to.equal('00:11:22:33:44:55');
                    done();
                };

            middleware(req, {}, next);
        });

        it('should assign macaddress to req with req._remoteAddress', function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();

            this.sandbox.stub(lookupService, 'ipAddressToMacAddress').resolves('00:11:22:33:44:55');

            var req = { _remoteAddress: '10.1.1.1', },
                next = function () {
                    expect(req.macaddress).to.equal('00:11:22:33:44:55');
                    expect(req.macAddress).to.equal('00:11:22:33:44:55');
                    done();
                };

            middleware(req, {}, next);
        });

        it('should assign macaddress to req with req.connection', function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();

            this.sandbox.stub(lookupService, 'ipAddressToMacAddress').resolves('00:11:22:33:44:55');

            var req = { connection: { remoteAddress: '10.1.1.1' } },
                next = function () {
                    expect(req.macaddress).to.equal('00:11:22:33:44:55');
                    expect(req.macAddress).to.equal('00:11:22:33:44:55');
                    done();
                };

            middleware(req, {}, next);
        });
    });

    describe('nodeIdToIpAddresses', function () {
        it('should return an empty array if no records exist', function() {
            this.sandbox.stub(waterline.lookups, 'findByTerm').resolves([]);

            return lookupService.nodeIdToIpAddresses(
                '507f1f77bcf86cd799439011'
            ).should.eventually.deep.equal([]);
        });

        it('should return an array with all assigned addresses', function() {
            this.sandbox.stub(waterline.lookups, 'findByTerm').resolves([
                { ipAddress: '1.1.1.1' },
                {},
                { ipAddress: '2.2.2.2'}
            ]);

            return lookupService.nodeIdToIpAddresses(
                '507f1f77bcf86cd799439011'
            ).should.eventually.deep.equal(['1.1.1.1', '2.2.2.2']);
        });
    });

    it('setIpAddress', function() {
        this.sandbox.stub(waterline.lookups, 'setIp').resolves();
        return lookupService.setIpAddress('ip', 'mac')
        .then(function() {
            expect(waterline.lookups.setIp).to.have.been.calledOnce;
            expect(waterline.lookups.setIp).to.have.been.calledWith('ip', 'mac');
        });
    });
});

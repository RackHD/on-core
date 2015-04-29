// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Lookup Service', function () {
    var lookupService, leaseCache, MacAddress, Errors, waterline;

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
        leaseCache = helper.injector.get('DhcpLeaseCache');
        MacAddress = helper.injector.get('MacAddress');
        Errors = helper.injector.get('Errors');
    });

    helper.after();

    describe('macAddressToNodeId', function () {
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
});


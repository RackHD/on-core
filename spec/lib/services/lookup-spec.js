// Copyright 2015, EMC, Inc.


'use strict';

describe('Lookup Service', function () {
    var lookupService,
        MacAddress,
        Errors,
        WaterlineService,
        ChildProcess,
        sandbox = sinon.sandbox.create();

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

    var withProxy = [{
        ipAddress: '127.0.0.1',
        macAddress: '00:11:22:33:44:55',
        node: 'node',
        proxy: '12.1.1.1'
    }];

    var node = {
        id: 'node'
    };

    helper.before(function(context) {
        context.Core = {
            start: sandbox.stub().resolves(),
            stop: sandbox.stub().resolves()
        };
        context.arpCache = {
            getCurrent: sandbox.stub().resolves()
        };

        return [
            helper.di.simpleWrapper(context.Core, 'Services.Core'),
            helper.di.simpleWrapper(context.arpCache, 'ARPCache')
        ];
    });

    before('Lookup Service before', function () {
        lookupService = helper.injector.get('Services.Lookup');
        WaterlineService = helper.injector.get('Services.Waterline');
        MacAddress = helper.injector.get('MacAddress');
        Errors = helper.injector.get('Errors');

        // Mock out the waterline collection methods and initialize them
        var config = {
                adapters: { mongo: {} },
                connections: { mongo: { adapter: 'mongo', url: '' }}
            };
        WaterlineService.start = sinon.spy(function() {
            var Waterline = helper.injector.get('Waterline');
            WaterlineService.service = new Waterline();
            helper.injector.getMatching('Models.*').forEach(function (model) {
                WaterlineService.service.loadCollection(model);
            });
            WaterlineService.service.initialize(config, function(err,data) {
                _.forOwn(data.collections, function(collection, name) {
                    WaterlineService[name] = collection;
                });
            });
        });
        WaterlineService.start();
    });

    helper.after();
    after(function() {
        sandbox.restore();
    });

    afterEach(function() {
        this.arpCache.getCurrent.resolves([]);
    });

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
          lookupService.resetMacRequests();
        });

        afterEach(function () {
          var configuration = helper.injector.get('Services.Configuration');
          configuration.set('externalLookupHelper', null);
        })

        it('should call findByTerm with macAddress', function() {
            var findByTerm = this.sandbox.stub(
                    WaterlineService.lookups, 'findByTerm').resolves(lookup);

            return lookupService.macAddressToNodeId('127.0.0.1').then(function (result) {
                expect(result).to.equal(lookup[0].node);
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(
                    WaterlineService.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.macAddressToNodeId('00:11:22:33:44:55')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
            });
        });

        it('should run helper script if no lookup record exists', function() {
            var helperPath = 'some-magic-script';
            var macAddress = '00:11:22:33:44:55'
            var findByTerm = this.sandbox.stub(
                    WaterlineService.lookups, 'findByTerm').resolves();
            var runExternalHelper = this.sandbox.stub(
                    lookupService, 'runExternalHelper').resolves();
            var configuration = helper.injector.get('Services.Configuration');
            configuration.set('externalLookupHelper', helperPath);

            expect(
                lookupService.macAddressToNodeId(macAddress)
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith(macAddress);
                expect(runExternalHelper).to.have.been.calledWith(helperPath, macAddress);
            });
        });

        it('use helper script output to fill in associations', function() {
            var helperPath = 'some-magic-script';
            var macAddress = lookup[0].macAddress;
            var ipAddress = lookup[0].ipAddress;
            var findByTerm = this.sandbox.stub(WaterlineService.lookups, 'findByTerm');
            findByTerm.onCall(0).resolves();
            findByTerm.onCall(1).resolves(lookup);
            var setIp = this.sandbox.stub(
                    WaterlineService.lookups, 'setIp').resolves();
            var configuration = helper.injector.get('Services.Configuration');
            configuration.set('externalLookupHelper', helperPath);
            lookupService.resetMacRequests();

            var fakeHelper = {
                run: this.sandbox.stub().resolves({
                    stdout: macAddress + ' ' + ipAddress + '\n'
                })
            };
            var runExternalHelper = this.sandbox.stub(lookupService, 'runExternalHelper', function () {
                return this.processHelperResults(fakeHelper);
            });

            return lookupService.macAddressToNodeId(macAddress).then(function (result) {
                expect(result).to.equal(lookup[0].node);
                expect(findByTerm).to.have.been.calledWith(macAddress);
                expect(runExternalHelper).to.have.been.calledWith(helperPath, macAddress);
                expect(setIp).to.have.been.calledWith(ipAddress, macAddress);
                expect(findByTerm).to.have.been.calledWith(macAddress);
            });
        });

        it('should only run the helper once per missing MAC address', function () {
            var helperPath = 'some-magic-script';
            var macAddress = lookup[0].macAddress;

            ChildProcess = helper.injector.get('ChildProcess');
            this.sandbox.stub(ChildProcess.prototype, '_parseCommandPath').returns(helperPath);

            var processHelperResults = this.sandbox.stub(lookupService, 'processHelperResults').resolves();

            var configuration = helper.injector.get('Services.Configuration');
            configuration.set('externalLookupHelper', helperPath);
            lookupService.resetMacRequests();

            var runs = [];
            for (var i = 0; i < 5; i++) {
                runs.push(lookupService.runExternalHelper(helperPath, macAddress));
            }

            expect(processHelperResults).to.have.been.calledOnce;

            return Promise.all(runs)
        });

        it('should reject with NotFoundError if no node association exists', function() {
            var findByTerm = this.sandbox.stub(
                    WaterlineService.lookups, 'findByTerm').resolves(noNode);

            return expect(
                lookupService.macAddressToNodeId('00:11:22:33:44:55')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
            });
        });
    });

    describe('macAddressToNode', function() {
        it('should call findByTerm with macAddress', function() {
            var findByTerm = this.sandbox.stub(
                    WaterlineService.lookups, 'findByTerm').resolves(lookup),
                needOneById = this.sandbox.stub(
                    WaterlineService.nodes, 'needOneById').resolves(node);

            return lookupService.macAddressToNode('00:11:22:33:44:55').then(function (result) {
                expect(result).to.equal(node);
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
                expect(needOneById).to.have.been.calledWith('node');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(
                    WaterlineService.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.macAddressToNode('00:11:22:33:44:55')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
            });
        });

        it('should reject with NotFoundError if no node association exists', function() {
            var findByTerm = this.sandbox.stub(
                WaterlineService.lookups, 'findByTerm').resolves(noNode);

            return expect(
                lookupService.macAddressToNode('00:11:22:33:44:55')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('00:11:22:33:44:55');
            });
        });

        it('should reject with NotFoundError if no node record exists', function() {
            var findByTerm = this.sandbox.stub(
                    WaterlineService.lookups, 'findByTerm').resolves(lookup),
                needOneById = this.sandbox.stub(WaterlineService.nodes, 'needOneById').rejects(
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

    describe('macAddressToIp', function () {
        beforeEach(function () {
          lookupService.resetNodeIdCache();
        });

        it('should call findByTerm with macAddress', function() {
            var ipAddress = lookup[0].ipAddress,
                findByTerm = this.sandbox.stub(
                    WaterlineService.lookups, 'findByTerm').resolves(lookup);
            return lookupService.macAddressToIp('127.0.0.1').then(function (result) {
                expect(result).to.equal(ipAddress);
                expect(findByTerm).to.have.been.calledWith(ipAddress);
            });
        });

        it('should reject with NotFoundError on findOneByTerm', function() {
            var ipAddress = lookup[0].ipAddress;
            this.sandbox.stub(WaterlineService.lookups, 'findByTerm').resolves({ipAddress:null});
            return expect(lookupService.macAddressToIp(ipAddress))
                .to.be.rejectedWith(Errors.NotFoundError);
        });
    });

    describe('ipAddressToMacAddress', function () {
        it('should call findByTerm with ipAddress', function() {
            var findByTerm = this.sandbox.stub(
                WaterlineService.lookups, 'findByTerm').resolves(lookup);

            return lookupService.ipAddressToMacAddress('127.0.0.1').then(function (result) {
                expect(result).to.equal(lookup[0].macAddress);
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(
                WaterlineService.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.ipAddressToMacAddress('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });
    });

    describe('ipAddressToNode', function () {
        it('should call findByTerm with ipAddress', function() {
            var findByTerm = this.sandbox.stub(
                    WaterlineService.lookups, 'findByTerm').resolves(lookup),
                needOneById = this.sandbox.stub(
                    WaterlineService.nodes, 'needOneById').resolves(node);

            return lookupService.ipAddressToNode('127.0.0.1').then(function (result) {
                expect(result).to.equal(node);
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
                expect(needOneById).to.have.been.calledWith('node');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(WaterlineService.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.ipAddressToNode('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no node association exists', function() {
            var findByTerm = this.sandbox.stub(
                WaterlineService.lookups, 'findByTerm').resolves(noNode);

            return expect(
                lookupService.ipAddressToNode('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no node record exists', function() {
            var findByTerm = this.sandbox.stub(
                WaterlineService.lookups, 'findByTerm').resolves(lookup),
                needOneById = this.sandbox.stub(WaterlineService.nodes, 'needOneById').rejects(
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
            var findByTerm = this.sandbox.stub(
                WaterlineService.lookups, 'findByTerm').resolves(lookup);

            return lookupService.ipAddressToNodeId('127.0.0.1').then(function (result) {
                expect(result).to.equal(lookup[0].node);
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(WaterlineService.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.ipAddressToNodeId('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });

        it('should reject with NotFoundError if no node association exists', function() {
            var findByTerm = this.sandbox.stub(
                WaterlineService.lookups, 'findByTerm').resolves(noNode);

            return expect(
                lookupService.ipAddressToNodeId('127.0.0.1')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('127.0.0.1');
            });
        });
    });

   describe('nodeIdToProxy', function () {
        beforeEach(function () {
          lookupService.resetNodeIdCache();
        });

        it('should call findByTerm with nodeId', function() {
            var findByTerm = this.sandbox.stub(
                WaterlineService.lookups, 'findByTerm').resolves(withProxy);

            return lookupService.nodeIdToProxy('node').then(function (result) {
                expect(result).to.equal(withProxy[0].proxy);
                expect(findByTerm).to.have.been.calledWith('node');
            });
        });

        it('should reject with NotFoundError if no lookup record exists', function() {
            var findByTerm = this.sandbox.stub(WaterlineService.lookups, 'findByTerm').resolves();

            return expect(
                lookupService.nodeIdToProxy('node')
            ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                expect(findByTerm).to.have.been.calledWith('node');
            });
        });

        it('should return undefined if no proxy association exists', function() {
            var findByTerm = this.sandbox.stub(
                WaterlineService.lookups, 'findByTerm').resolves(lookup);

            return lookupService.nodeIdToProxy('node').then(function (result) {
                expect(result).to.equal(undefined);
                expect(findByTerm).to.have.been.calledWith('node');
            });
        });
    });

    describe('ipAddressToMacAddressMiddleware', function () {
        it('should assign macaddress to req with req.ip', function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();

            this.sandbox.stub(lookupService, 'ipAddressToMacAddress').resolves('00:11:22:33:44:55');

            var req = {
                    ip: '10.1.1.1',
                    get: function() {
                        return undefined;
                    }
                },
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

            var req = {
                    _remoteAddress: '10.1.1.1',
                    get: function() {
                        return undefined;
                    }
                },
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

            var req = {
                    connection: { remoteAddress: '10.1.1.1' },
                    get: function() {
                        return undefined;
                    }
                },
                next = function () {
                    expect(req.macaddress).to.equal('00:11:22:33:44:55');
                    expect(req.macAddress).to.equal('00:11:22:33:44:55');
                    done();
                };

            middleware(req, {}, next);
        });

        it('should assign macaddress to req with req.get(X-Real-IP)', function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();

            this.sandbox.stub(lookupService, 'ipAddressToMacAddress').resolves('00:11:22:33:44:55');

            var req = {
                    get: function(header) {
                        if(header === 'X-Real-IP') {
                            return '10.1.1.1';
                        }
                        return undefined;
                    }
                },
                next = function () {
                    try {
                        expect(req.macaddress).to.equal('00:11:22:33:44:55');
                        expect(req.macAddress).to.equal('00:11:22:33:44:55');
                        done();
                    } catch (e) {
                        done(e);
                    }
                };

            middleware(req, {}, next);
        });

        it('should return undefined', function (done) {
            var middleware = lookupService.ipAddressToMacAddressMiddleware();

            this.sandbox.stub(lookupService, 'ipAddressToMacAddress').resolves(undefined);

            var req = {
                    get: function() {
                        return undefined;
                    }
                },
                next = function () {
                    expect(req.macaddress).to.equal(undefined);
                    done();
                };

            middleware(req, {}, next);
        });
    });

    describe('nodeIdToIpAddresses', function () {
        it('should return an empty array if no records exist', function() {
            this.sandbox.stub(WaterlineService.lookups, 'findByTerm').resolves([]);

            return lookupService.nodeIdToIpAddresses(
                '507f1f77bcf86cd799439011'
            ).should.eventually.deep.equal([]);
        });

        it('should return an array with all assigned addresses', function() {
            this.sandbox.stub(WaterlineService.lookups, 'findByTerm').resolves([
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
        this.sandbox.stub(WaterlineService.lookups, 'setIp').resolves();
        return lookupService.setIpAddress('ip', 'mac')
        .then(function() {
            expect(WaterlineService.lookups.setIp).to.have.been.calledOnce;
            expect(WaterlineService.lookups.setIp).to.have.been.calledWith('ip', 'mac');
        });
    });

    it('validateArpCache', function() {
        this.sandbox.stub(WaterlineService.lookups, 'setIp').resolves();
        this.arpCache.getCurrent.resolves([{mac:'mac', ip:'ip'}]);
        return lookupService.validateArpCache()
        .then(function() {
            expect(WaterlineService.lookups.setIp).to.have.been.calledOnce;
            expect(WaterlineService.lookups.setIp).to.have.been.calledWith('ip', 'mac');
        });
    });
});

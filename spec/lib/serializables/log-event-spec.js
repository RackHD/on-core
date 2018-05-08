// Copyright 2015, EMC, Inc.


'use strict';

describe('LogEvent', function () {
    var LogEvent;
    var lookupService;

    helper.before();

    before(function () {
        LogEvent = helper.injector.get('LogEvent');
        lookupService = helper.injector.get('Services.Lookup');
    });

    helper.after();
    describe('Class Methods', function() {
        describe('sanitize', function() {
            it('should not remove fields not marked for sanitization', function() {
                LogEvent.sanitize(
                    { foo: 'bar' }
                ).should.deep.equal({ foo: 'bar' });
            });

            it('should remove fields marked for sanitization', function() {
                LogEvent.sanitize(
                    { ip: '127.0.0.1', foo: 'bar' }
                ).should.deep.equal({ foo: 'bar' });
            });

            it('should not remove nested fields marked for sanitization', function() {
                LogEvent.sanitize(
                    { foo: { ip: '127.0.0.1' } }
                ).should.deep.equal({ foo: { ip: '127.0.0.1' } });
            });
        });

        describe('redact', function() {
            var testRedactKeys = ['password', 'PASSWORD', 'serverPassword', 'plainPassword',
                'Password123', 'pppassword', 'encryptedPasswords', 'community',
                'productkey', 'Productkey'];
            var testNotRedactKeys = ['pass_word', 'foobar', 'Community', 'community123',
                'acommunity', 'p.assword', 'aproductkey', 'produckey123', 'product.key'];

            before('redact', function() {
                //intentionally add some non-supported redactions to verify they are ignored
                LogEvent.initRedact([/password/i, 'community', /^productkey$/i, 123, ['a', 'b']]);
            });

            it('should have initialized the RegExp redaction pattern in advance', function() {
                LogEvent._redactPatterns.should.be.an.array;
                LogEvent._redactPatterns.should.have.length(3);
                _.isRegExp(LogEvent._redactPatterns[0]).should.be.true;
                LogEvent._redactPatterns[0].toString().should.equal('/password/i');
            });

            it('should have kept the String redaction pattern of its original type', function() {
                LogEvent._redactPatterns[1].should.be.a('string');
                LogEvent._redactPatterns[1].toString().should.equal('community');
            });

            it('should not redact fields not marked for redaction', function() {
                _.forEach(testNotRedactKeys, function(key) {
                    var srcObj = {};
                    srcObj[key] = 'bar';
                    LogEvent.redact(srcObj).should.deep.equal(srcObj);
                });
            });

            it('should succeed if the field is a string array', function() {
                var srcObj = { array: [ {'bar': ['foo']} ] };
                LogEvent.redact(srcObj).should.deep.equal(srcObj);
            });

            it('should redact fields which are marked for redaction', function() {
                _.forEach(testRedactKeys, function(key) {
                    var srcObj = {}, dstObj = {};
                    srcObj[key] = 'bar';
                    dstObj[key] = '[REDACTED]';
                    LogEvent.redact(srcObj).should.deep.equal(dstObj);
                });
            });

            it('should redact fields in nested objects', function() {
                _.forEach(testRedactKeys, function(key) {
                    var srcObj = { nested: {} };
                    var dstObj = { nested: {} };
                    srcObj.nested[key] = 'bar';
                    dstObj.nested[key] = '[REDACTED]';
                    LogEvent.redact(srcObj).should.deep.equal(dstObj);
                });
            });

            it('should redact fields in nested arrays', function() {
                _.forEach(testRedactKeys, function(key) {
                    var srcObj = { array: [ {} ] };
                    var dstObj = { array: [ {} ] };
                    srcObj.array[0][key] = 'bar';
                    dstObj.array[0][key] = '[REDACTED]';
                    LogEvent.redact(srcObj).should.deep.equal(dstObj);
                });
            });

            it('should not modify the original object', function () {
                _.forEach(testRedactKeys, function(key) {
                    var target = {};
                    target[key] = 'bar';
                    var cloneTarget = _.cloneDeep(target);
                    LogEvent.redact(target);
                    target.should.deep.equal(cloneTarget);
                });
            });

            describe('LogEvent.testRedact', function() {
                it('should return false if the tested value is not string', function() {
                    _.forEach([1, {foo: 'bar'}, null, ['a', 'b'] ], function(val) {
                        LogEvent.testRedact(val).should.be.false;
                    });
                });
            });
        });

        describe('getUniqueId', function() {
            var sandbox;
            before(function() {
                sandbox = sinon.sandbox.create();
            });

            afterEach(function() {
                sandbox.restore();
            });

            it('should return undefined for empty context', function() {
                return LogEvent.getUniqueId().should.become(undefined);
            });

            it('should favor context.id', function() {
                return LogEvent.getUniqueId({
                    id: 'testid',
                    macaddress: 'testmac',
                    ip: 'testip'
                }).should.become('testid');
            });

            it('should favor macaddress if id not exists', function() {
                sandbox.stub(lookupService, 'macAddressToNodeId')
                    .withArgs('testmac').resolves('aa:bb:cc:dd:ee:ff');
                return LogEvent.getUniqueId({
                    macaddress: 'testmac',
                    ip: 'testip'
                }).should.become('aa:bb:cc:dd:ee:ff');
            });

            it('should reject if lookup macaddress fails', function() {
                sandbox.stub(lookupService, 'macAddressToNodeId')
                    .withArgs('testmac').rejects();
                return LogEvent.getUniqueId({
                    macaddress: 'testmac',
                    ip: 'testip'
                }).should.be.rejected;
            });

            it('should favor ip if both id & macaddress not exists', function() {
                sandbox.stub(lookupService, 'ipAddressToNodeId')
                    .withArgs('testip').resolves('192.168.100.1');
                return LogEvent.getUniqueId({
                    ip: 'testip',
                    other: 'testother'
                }).should.become('192.168.100.1');
            });

            it('should reject if lookup ip fails', function() {
                sandbox.stub(lookupService, 'ipAddressToNodeId')
                    .withArgs('testip').rejects();
                return LogEvent.getUniqueId({
                    ip: 'testip',
                    other: 'testother'
                }).should.be.rejected;
            });

            it('should return undefined if id/macaddress/ip all not exist', function() {
                return LogEvent.getUniqueId({
                    'test': 'testmessage',
                    'abc': 'testabc'
                }).should.become(undefined);
            });
        });

        describe('getSubject', function() {
            var sandbox;
            before(function() {
                sandbox = sinon.sandbox.create();
            });

            afterEach(function() {
                sandbox.restore();
            });

            it('should return subject', function() {
                sandbox.stub(LogEvent, 'getUniqueId')
                    .withArgs('testContext').resolves('testSubject');
                return LogEvent.getSubject('testContext').should.become('testSubject');
            });

            it('should return default subject if getUniqueId returns empty', function() {
                sandbox.stub(LogEvent, 'getUniqueId')
                    .withArgs('testContext').resolves();
                return LogEvent.getSubject('testContext').should.become('Server');
            });

            it('should return default subject if getUniqueId rejects', function() {
                sandbox.stub(LogEvent, 'getUniqueId')
                    .withArgs('testContext').rejects();
                return LogEvent.getSubject('testContext').should.become('Server');
            });
        });

        describe('setColorEnable', function() {
            var colors;

            before(function() {
                colors = helper.injector.get('colors');
            });

            it('should enable colors', function() {
                LogEvent.setColorEnable(true);
                expect(colors.enabled).to.be.true;
                expect(LogEvent.colorEnable).to.be.true;
            });

            it('should disable colors', function() {
                LogEvent.setColorEnable(false);
                expect(colors.enabled).to.be.false;
                expect(LogEvent.colorEnable).to.be.false;
            });
        });
    });
});


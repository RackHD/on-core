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
            it('should not redact fields not marked for redaction', function() {
                LogEvent.redact(
                    { foo: 'bar' }
                ).should.deep.equal({ foo: 'bar' });
            });

            it('should redact fields which are marked for redaction', function() {
                LogEvent.redact(
                    { password: 'bar' }
                ).should.deep.equal({ password: '[REDACTED]' });
            });

            it('should redact fields in nested objects', function() {
                LogEvent.redact(
                    { nested: { password: 'bar' } }
                ).should.deep.equal({ nested: { password: '[REDACTED]' } });
            });

            it('should redact fields in nested arrays', function() {
                LogEvent.redact(
                    { array: [ { password: 'bar' } ] }
                ).should.deep.equal({ array: [ { password: '[REDACTED]' } ] });
            });

            it('should not modify the original object', function () {
                var target = { password: 'bar' };

                LogEvent.redact(target);

                target.should.deep.equal({ password: 'bar' });
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


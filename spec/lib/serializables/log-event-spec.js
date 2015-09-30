// Copyright 2015, EMC, Inc.


'use strict';

describe('LogEvent', function () {
    var LogEvent;

    helper.before();

    before(function () {
        LogEvent = helper.injector.get('LogEvent');
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
    });
});


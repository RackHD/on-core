// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('LogPublisher', function () {
    var LogEvent;

    helper.before();

    before(function () {
        LogEvent = helper.injector.get('LogEvent');
        this.subject = helper.injector.get('Services.LogPublisher');
    });

    helper.after();

    describe('handleLogEvent', function() {
        it('should not throw on errors', function() {
            var self = this;

            sinon.stub(LogEvent, 'create').rejects(new Error('Test'));

            expect(function () {
                self.subject.handleLogEvent();
            }).to.not.throw();
        });
    });
});


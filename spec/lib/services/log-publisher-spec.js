// Copyright (c) 2015, EMC Corporation


'use strict';

describe('LogPublisher', function () {
    var LogEvent, events;

    helper.before();

    before(function () {
        LogEvent = helper.injector.get('LogEvent');
        events = helper.injector.get('Events');
        this.subject = helper.injector.get('Services.LogPublisher');
    });

    helper.after();

    describe('handleLogEvent', function() {
        it('should not throw on errors', function() {
            var create = this.sandbox.stub(LogEvent, 'create').rejects(new Error('Test')),
                ignoreError = this.sandbox.stub(events, 'ignoreError');

            return this.subject.handleLogEvent().then(function () {
                create.should.have.been.called;
                ignoreError.should.have.been.called;
            });
        });
    });
});


// Copyright (c) 2015, EMC Corporation
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
        it('should not throw on errors', function(done) {
            sinon.stub(LogEvent, 'create').rejects(new Error('Test'));

            this.subject.on('error', function (error) {
                error.message.should.equal('Test');
                done();
            });

            this.subject.handleLogEvent();
        });
    });
});


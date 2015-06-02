// Copyright (c) 2015, EMC Corporation
/* jshint node:true */

'use strict';

describe('Extensions', function () {
    var Timer;

    helper.before();

    before(function () {
        Timer = helper.injector.get('Timer');
    });

    helper.after();

    describe('Timer', function () {
        describe('start', function () {
            it('should store hrtime internally', function () {
                var subject = new Timer();

                subject.start();

                subject.time.should.be.ok;
            });
        });

        describe('clear', function () {
            it('should clear the time internally', function () {
                var subject = new Timer();

                subject.start();

                subject.time.should.be.ok;

                subject.clear();

                expect(subject.time).to.be.undefined;
            });
        });

        describe('stop', function () {
            it('should diff the start time with the stop time', function () {
                var subject = new Timer();

                subject.start();

                var diff = subject.stop();

                diff.should.be.a('number');

                diff.should.be.gt(0.0);
            });
        });
    });
});
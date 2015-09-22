// Copyright 2015, EMC, Inc.


'use strict';

var dgram = require('dgram');

describe("StatsD Service", function () {
    helper.before();

    before(function () {
        this.subject = helper.injector.get('Services.StatsD');
    });

    helper.after();

    describe('StatsD Methods', function () {
        [
            'timing',
            'increment',
            'decrement',
            'histogram',
            'gauge',
            'set',
            'unique'
        ].forEach(function (method) {
            it('should have a ' + method, function () {
                this.subject.should.respondTo(method);
            });
        });
    });

    describe('sanitize', function () {
        it('should not alter a basic key', function () {
            this.subject.sanitize('test').should.equal('test');
        });

        it('should remove bson id from the end of the key', function () {
            this.subject.sanitize('test.551375513754f63fa62abc47').should.equal('test');
        });

        it('should remove uuidv4 from the end of the key', function () {
            this.subject.sanitize('test.de305d54-75b4-431b-adb2-eb6b9e546013').should.equal('test');
        });
    });

    describe('Publishing', function () {
        before(function () {
            var self = this;

            return new Promise(function (resolve) {
                self.server = dgram.createSocket('udp4');
                self.server.bind(8125);

                self.server.once('listening', function () {
                    resolve();
                });
            });
        });

        it('should publish metrics to localhost:8125', function (done) {
            this.server.once('message', function () {
                done();
            });

            this.subject.gauge('test', 1);
        });

        after(function () {
            this.server.close();
        });
    });
});

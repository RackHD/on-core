// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Logging protocol functions", function () {
    helper.before();

    before(function () {
        this.logging =helper.injector.get('Protocol.Logging');
    });

    helper.after();

    describe("publish log message", function() {

        it("should throw an error if log level isn't known", function() {
            var self = this,
                data = { foo: 'bar' };

            expect(function() {
                self.logging.publishLog('foo', data);
            }).to.throw(Error);
            //NOTE: heckj: no good way with AssertPlus to verify basic subclass of error

        });

        [
            'emerg',
            'alert',
            'crit',
            'error',
            'warning',
            'notice',
            'info',
            'debug',
            'silly'
        ].forEach(function (level) {
                it("should publish a poller alert event with level "+level, function() {
                    //NOTE: no matching internal code to listen for these events
                    var self = this,
                        data = { foo: 'bar' };

                    return self.logging.publishLog(level, data);
                });

            });

            });

});
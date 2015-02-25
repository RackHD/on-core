// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Logging protocol functions", function () {
    helper.before();

    before(function () {
        this.logging = helper.injector.get('Protocol.Logging');
    });

    helper.after();

    describe("publish log message", function () {

        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should throw an error if log level isn't known", function () {
            var self = this,
                data = {foo: 'bar'};

            expect(function () {
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
                it("should publish a log message with level " + level, function () {
                    //NOTE: no matching internal code to listen for these events
                    var self = this,
                        Q = helper.injector.get('Q'),
                        deferred = Q.defer(),
                        data = {foo: 'bar'};

                    self.logging.subscribeLog(level, function(_data) {
                        try {
                            expect(_data).to.deep.equal(data);
                            deferred.resolve();
                        } catch(err) {
                            deferred.reject(err);
                        }
                    }).then(function(subscription) {
                        expect(subscription).to.be.ok;
                        testSubscription = subscription;

                        return self.logging.publishLog(level, data);
                    }).catch(function(err) {
                        deferred.reject(err);
                    });

                    return deferred.promise;
                });

            });

    });

});

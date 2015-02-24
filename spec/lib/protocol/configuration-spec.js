// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Configuration Protocol functions", function () {

    helper.before();

    before(function () {
        this.configuration = helper.injector.get('Protocol.Configuration');
    });

    helper.after();

    describe("subscribeSet", function() {
        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should subscribe and publish sets", function() {
            var self = this,
                Q = helper.injector.get('Q'),
                deferred = Q.defer(),
                data = { key: 'bar', value: 'baz' };

            self.configuration.subscribeSet(function(data) {
                try {
                    expect(data).to.have.property('key', 'bar');
                    expect(data).to.have.property('value', 'baz');
                    deferred.resolve();
                } catch(err) {
                    deferred.reject(err);
                }
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.configuration.publishSet(data);
            }).catch(function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        });
    });

    describe.skip("subscribeGet", function() {
        var testSubscription;
        afterEach("cancel afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should subscribe", function() {
            var self = this;

            return self.configuration.subscribeGet(function(_data) {
                //NOTE(heckj): need matching code to invoke this subscription
            });
        });
    });

});
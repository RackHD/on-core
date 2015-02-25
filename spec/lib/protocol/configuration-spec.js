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
        afterEach("subscribeSet afterEach", function() {
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

    describe("subscribeGet", function() {
        var testSubscription;
        afterEach("subscribeGet afterEach", function() {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should subscribe and publish gets", function() {
            var self = this,
                Q = helper.injector.get('Q'),
                deferred = Q.defer(),
                data = { key: 'bar', value: 'baz' };

            self.configuration.subscribeGet(function(data) {
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

                return self.configuration.publishGet(data);
            }).catch(function(err) {
                deferred.reject(err);
            });

            return deferred.promise;
        });
    });
});

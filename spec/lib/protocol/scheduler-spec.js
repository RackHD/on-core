// Copyright 2015, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Schedular protocol functions", function () {
    helper.before();

    before(function () {
        this.scheduler = helper.injector.get('Protocol.Scheduler');
    });

    helper.after();

    describe("schedule", function () {

        var testSubscription;
        afterEach("schedule afterEach", function () {
            // unsubscribe to clean up after ourselves
            if (testSubscription) {
                return testSubscription.dispose();
            }
        });

        it("should publish and receive a schedule reques", function () {
            //NOTE: no matching internal code to listen for these events
            var self = this,
                Q = helper.injector.get('Q'),
                uuid = helper.injector.get('uuid'),
                deferred = Q.defer(),
                taskId = uuid.v4(),
                taskName = "testTaskName";

            self.scheduler.subscribeSchedule(function (cbTaskId, cbTaskName) {
                try {
                    expect(cbTaskId).to.equal(taskId);
                    expect(cbTaskName).to.equal(taskName);
                    deferred.resolve();
                } catch (err) {
                    deferred.reject(err);
                }
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return self.scheduler.schedule(taskId, taskName);
            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        });
    });

});

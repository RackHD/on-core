// Copyright 2015, EMC, Inc.


'use strict';

describe("Schedular protocol functions", function () {
    var testSubscription,
        testMessage,
        messenger,
        scheduler;
        
    helper.before();

    before(function () {
        scheduler = helper.injector.get('Protocol.Scheduler');
        messenger = helper.injector.get('Services.Messenger');
        var Message = helper.injector.get('Message');
        var Subscription = helper.injector.get('Subscription');
        
        testSubscription = new Subscription({},{});
        testMessage = new Message({},{},{});
        sinon.stub(testMessage);
    });

    beforeEach(function() {
        this.sandbox.stub(messenger, 'request');
    });

    helper.after();

    describe("schedule", function () {

        it("should publish and receive a schedule request", function () {
            //NOTE: no matching internal code to listen for these events
            var self = this,
                Promise = helper.injector.get('Promise'),
                uuid = helper.injector.get('uuid'),
                deferred = Promise.defer(),
                data = {
                    taskId:uuid.v4(),
                    taskName:"testTaskName",
                    overrides: {
                        timeout: -1
                    }
                };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(data,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves(data);
            return scheduler.subscribeSchedule(function (cbTaskId, cbTaskName, cbOverrides) {
                try {
                    expect(cbTaskId).to.equal(data.taskId);
                    expect(cbTaskName).to.equal(data.taskName);
                    expect(cbOverrides).to.deep.equal(data.overrides);
                    deferred.resolve();
                } catch (err) {
                    deferred.reject(err);
                }
            }).then(function (subscription) {
                expect(subscription).to.be.ok;
                return scheduler.schedule(data.taskId, data.taskName, data.overrides);
            }).catch(function (err) {
                deferred.reject(err);
            });

            return deferred.promise;
        });
    });
});

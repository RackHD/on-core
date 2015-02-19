// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */
/* global _: false */

'use strict';

var base = require('./base-spec');

describe('Models.WorkItem', function () {
    helper.before();

    var workitems;
    var Q;
    var uuid;

    base.before(function (context) {
        Q = helper.injector.get('Q');
        uuid = helper.injector.get('uuid');
        workitems = context.model = helper.injector.get('Services.Waterline').workitems;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Work Queue Behavior', function () {
        function createWorkItems() {
            var now = Date.now();
            var yesterday = new Date(now - 60 * 60 * 24 * 1000);
            var tomorrow = new Date(now + 60 * 60 * 24 * 1000);
            return workitems.create([{
                name: 'First Past',
                pollInterval: 10 * 1000
            }, {
                name: 'Second Yesterday',
                pollInterval: 10 * 1000,
                nextScheduled: new Date(yesterday + 1000)
            }, {
                name: 'First Tomorrow',
                pollInterval: 10 * 1000,
                nextScheduled: tomorrow
            }, {
                name: 'Second Tomorrow',
                pollInterval: 10 * 1000,
                nextScheduled: new Date(tomorrow.valueOf() + 1000)
            }]);
        }

        var defaultItems;
        var workerId;

        beforeEach('reset DB collections', function () {
            return helper.reset();
        });

        beforeEach('create test work items', function () {
            workerId = uuid.v4();
            return createWorkItems().then(function (items) {
                expect(items).to.have.length(4);
                defaultItems = _.sortBy(items, 'id');
            });
        });

        it('should start the next scheduled work item', function () {
            var now = new Date();
            return workitems.startNextScheduled(workerId, {}, 10 * 1000).then(function(scheduled) {
                expect(scheduled).to.be.an('object');
                expect(scheduled.name).to.equal('First Past');
                expect(scheduled.id).to.equal(defaultItems[0].id);
                expect(scheduled.lastStarted).to.be.an.instanceof(Date);
                expect(scheduled.leaseToken).to.equal(workerId);
                expect(scheduled.leaseExpires).to.be.greaterThan(now);
            });
        });

        it('should start the next scheduled work item and mark as succeeded', function () {
            return workitems.startNextScheduled(workerId, {}, 1000).then(function(scheduled) {
                var now = new Date();
                return workitems.setSucceeded(workerId, scheduled).then(function (succeeded) {
                    expect(succeeded).to.have.length(1);
                    succeeded = succeeded[0];
                    expect(succeeded).to.be.an('object');
                    expect(succeeded.id).to.equal(scheduled.id);
                    expect(succeeded.nextScheduled).to.be.greaterThan(now);
                    expect(succeeded.failureCount).to.equal(0);
                    expect(succeeded.leaseToken).to.equal(null);
                    expect(succeeded.leaseExpires).to.equal(null);
                    expect(succeeded.lastFinished).to.be.an.instanceof(Date);
                });
            });
        });

        it('should start the next scheduled work item and mark as failed', function () {
            return workitems.startNextScheduled(workerId, {}, 1000).then(function(scheduled) {
                var now = new Date();
                return workitems.setFailed(workerId, scheduled).then(function (succeeded) {
                    expect(succeeded).to.have.length(1);
                    succeeded = succeeded[0];
                    expect(succeeded).to.be.an('object');
                    expect(succeeded.id).to.equal(scheduled.id);
                    expect(succeeded.nextScheduled).to.be.greaterThan(now);
                    expect(succeeded.failureCount).to.equal(1);
                    expect(succeeded.leaseToken).to.equal(null);
                    expect(succeeded.leaseExpires).to.equal(null);
                    expect(succeeded.lastFinished).to.be.an.instanceof(Date);
                });
            });
        });

        it('should not start items queued in the future', function () {
            // get the first two with nextScheduled from yesterday
            return workitems.startNextScheduled(workerId, {}, 10 * 1000)
            .then(function(scheduled) {
                expect(scheduled).to.be.an('object');
                return workitems.startNextScheduled(workerId, {}, 10 * 1000)
                .then(function(scheduled) {
                    expect(scheduled).to.be.an('object');
                    return workitems.startNextScheduled(workerId, {}, 10 * 1000)
                    .then(function(scheduled) {
                        // third one is queued tomorrow
                        expect(scheduled).to.be.undefined;
                    });
                });
            });
        });

        it('should properly queue two work items at the same time', function () {
            var otherWorkerId = uuid.v4();
            return Q.all([
                workitems.startNextScheduled(workerId, {}, 10 * 1000),
                workitems.startNextScheduled(otherWorkerId, {}, 10 * 1000)
            ])
            .then(function(scheduled) {
                expect(scheduled[0]).to.be.an('object');
                expect(scheduled[1]).to.be.an('object');
                expect(scheduled[0].id).to.not.equal(scheduled[1].id);
            });
        });

        it('should start two items and mark as succeded', function () {
            var otherWorkerId = uuid.v4();
            return Q.all([
                workitems.startNextScheduled(workerId, {}, 10 * 1000),
                workitems.startNextScheduled(otherWorkerId, {}, 10 * 1000)
            ])
            .then(function(scheduled) {
                return workitems.setSucceeded(null, scheduled).then(function (succeeded) {
                    expect(succeeded).to.have.length(2);
                    expect(succeeded[0].leaseToken).to.equal(null);
                    expect(succeeded[1].leaseToken).to.equal(null);
                });
            });
        });

        it('should start two items and mark as failed', function () {
            var otherWorkerId = uuid.v4();
            return Q.all([
                workitems.startNextScheduled(workerId, {}, 10 * 1000),
                workitems.startNextScheduled(otherWorkerId, {}, 10 * 1000)
            ])
            .then(function(scheduled) {
                return workitems.setFailed(null, scheduled).then(function (failed) {
                    expect(failed).to.have.length(2);
                    expect(failed[0].leaseToken).to.equal(null);
                    expect(failed[1].leaseToken).to.equal(null);
                });
            });
        });

        it('should find a work item with an expired lease', function () {
            var now = new Date();
            return workitems.startNextScheduled(workerId, {}, -10 * 1000).then(function(scheduled) {
                return workitems.findExpired(now).then(function (expired) {
                    expect(expired).to.have.length(1);
                    expect(expired[0].id).to.equal(scheduled.id);
                    expect(expired[0].leaseToken).to.equal(workerId);
                });
            });
        });

        it('should create ipmi pollers for a node', function () {
            var nodeId = '47bd8fb80abc5a6b5e7b10de';
            return workitems.createIpmiPollers(nodeId).then(function (items) {
                expect(items).to.have.length(3);
                items.forEach(function (item) {
                    expect(item.name).to.equal('Pollers.IPMI');
                    expect(item.node).to.equal(nodeId);
                });
            });
        });

        it('should create ipmi pollers and then find them with findPollers', function () {
            var nodeId = '47bd8fb80abc5a6b5e7b10df';
            return workitems.createIpmiPollers(nodeId).then(function (items) {
                items = _.sortBy(items, 'id');
                return workitems.findPollers().then(function (pollers) {
                    pollers = _.sortBy(pollers, 'id');
                    expect(pollers).to.have.length(3);
                    pollers.forEach(function (poller, index) {
                        expect(poller.id).to.equal(items[index].id);
                        expect(poller.config.command).to.equal(items[index].config.command);
                        expect(poller.node).to.equal(nodeId);
                    });
                });
            });
        });
    });


});


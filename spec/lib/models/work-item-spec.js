// Copyright 2015, EMC, Inc.

/* global _: false */

'use strict';

var base = require('./base-spec');

describe('Models.WorkItem', function () {
    helper.before();

    var workitems;
    var Promise;
    var uuid;
    var _nodeId;
    var snmpPoller;

    base.before(function (context) {
        Promise = helper.injector.get('Promise');
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

        beforeEach(function() {
            this.sandbox = sinon.sandbox.create();
            _nodeId = '47bd8fb80abc5a6b5e7b10df';
            snmpPoller = {
                "name": "Pollers.SNMP",
                "node": _nodeId,
                "pollInterval": 60 * 60 * 1000 * 0.75,
                "config": {
                    "alerts": [
                        {
                            '.1.3.6.1.2.1.1.5': "testAlert",
                            '.1.3.6.1.2.1.1.1': "/testAlert/"
                        }
                    ],
                    "oids": [
                        '.1.3.6.1.2.1.1.1',
                        '.1.3.6.1.2.1.1.5'
                    ]
                }
            };
        });

        afterEach(function() {
            this.sandbox.restore();
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
            return Promise.all([
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
            return Promise.all([
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
            return Promise.all([
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

        it('should create a poller and then find it with findPollers', function () {
            var nodeId = '47bd8fb80abc5a6b5e7b10df';
            var poller = {
                "name": "Pollers.IPMI",
                "node": nodeId,
                "pollInterval": 60000,
                "config": {
                    "command": "sdr"
                }
            };
            return workitems.create(poller).then(function () {
                return workitems.findPollers().then(function (pollers) {
                    expect(pollers).to.have.length(1);
                    expect(pollers[0].config.command).to.equal(poller.config.command);
                    expect(pollers[0].node).to.equal(nodeId);
                });
            });
        });

        it('should not schedule paused work items', function (){
            return workitems.updateOne({ name: 'First Past' }, { paused: true })
            .then(function () {
                return workitems.startNextScheduled(workerId, {}, 10 * 1000);
            })
            .then(function(scheduled) {
                expect(scheduled.name).to.equal('Second Yesterday');
                return workitems.startNextScheduled(workerId, {}, 10 * 1000);
            })
            .then(function(scheduled) {
                // there should be none left that are schedulable
                expect(scheduled).to.be.undefined;
            });
        });

        it('should update the database document to increase wait time on  setFailed', function() {
            this.sandbox.spy(workitems, 'update');
            var workItem = {
                "name": "Will.Fail",
                "pollInterval": 1000,
                "config": {
                    "command": "sel"
                }
            };
            return workitems.create(workItem)
            .then(function(workitem) {
                return workitems.setFailed(null, workitem);
            })
            .then(function() {
                expect(workitems.update.firstCall.args[1].nextScheduled.valueOf())
                .to.equal(workitems.update.firstCall.args[1].lastFinished.valueOf() +
                        workItem.pollInterval * 2);
            });
        });

        it('should reschedule using the poll interval on setSucceeded', function() {
            this.sandbox.spy(workitems, 'update');
            var nodeId = '47bd8fb80abc5a6b5e7b10df';
            var workItem = {
                "name": "Pollers.IPMI",
                "node": nodeId,
                "pollInterval": 60000,
                "config": {
                    "command": "sdr"
                }
            };
            return workitems.create(workItem)
            .then(function(workitem) {
                return workitems.setSucceeded(null, workitem);
            })
            .then(function() {
                expect(workitems.update.firstCall.args[1].nextScheduled.valueOf())
                .to.equal(workitems.update.firstCall.args[1].lastFinished.valueOf() +
                        workItem.pollInterval);
            });
        });

        it('should reschedule with at most a one hour delay', function() {
            this.sandbox.spy(workitems, 'update');
            var nodeId = '47bd8fb80abc5a6b5e7b10df';
            var workItem = {
                "name": "Pollers.IPMI",
                "node": nodeId,
                "pollInterval": 60 * 60 * 1000 * 0.75,
                "config": {
                    "command": "sdr"
                }
            };
            return workitems.create(workItem)
            .then(function(workitem) {
                return workitems.setFailed(null, workitem);
            })
            .then(function() {
                expect(workitems.update.lastCall.args[1].nextScheduled.valueOf())
                .to.equal(workitems.update.lastCall.args[1].lastFinished.valueOf() +
                        60 * 60 * 1000);
            });
        });

        it('should deserialize workitems containing numeric oids', function() {
            this.sandbox.spy(workitems, 'deserialize');
            var workItem = snmpPoller;

            var deserialized = workitems.deserialize(workItem);
            expect(deserialized.config.alerts[0]).to.deep.equal(
                {
                    '.1.3.6.1.2.1.1.5': "testAlert",
                    '.1.3.6.1.2.1.1.1': "/testAlert/"
                }
            );
            expect(deserialized.config.oids).to.deep.equal(
                [
                    '.1.3.6.1.2.1.1.1',
                    '.1.3.6.1.2.1.1.5'
                ]
            );

        });

        it('should sanitize created workitems', function() {
            var workItem = snmpPoller;

            return workitems.create(workItem)
            .then(function(workItem) {
                expect(workItem.config.alerts[0]).to.deep.equal({
                        '_1_3_6_1_2_1_1_5': "testAlert",
                        '_1_3_6_1_2_1_1_1': "/testAlert/"
                });
                expect(workItem.config.oids).to.deep.equal([
                     '_1_3_6_1_2_1_1_1',
                     '_1_3_6_1_2_1_1_5'
                ]);
            });
        });

        it('should sanitize updated workitems', function() {
            var workItem = snmpPoller;

            workitems.beforeUpdate(workItem, function(){});

            expect(workItem.config.alerts[0]).to.deep.equal({
                    '_1_3_6_1_2_1_1_5': "testAlert",
                    '_1_3_6_1_2_1_1_1': "/testAlert/"
            });
            expect(workItem.config.oids).to.deep.equal([
                 '_1_3_6_1_2_1_1_1',
                 '_1_3_6_1_2_1_1_5'
            ]);
        });
    });


});


// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = WorkItemModelFactory;

WorkItemModelFactory.$provide = 'Models.WorkItem';
WorkItemModelFactory.$inject = [
    'Model',
    '_',
    'Promise',
    'Assert',
    'Constants'
];

function WorkItemModelFactory (Model, _, Promise, assert, Constants) {

    function byPollers() {
        return {
            or: _.map(Constants.WorkItems.Pollers, function (pollerName) {
                return { name: pollerName };
            })
        };
    }
    return Model.extend({
        connection: 'mongo',
        identity: 'workitems',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            node: {
                model: 'nodes',
                defaultsTo: null
            },
            config: {
                type: 'json',
                defaultsTo: {}
            },
            pollInterval: {
                type: 'integer',
                required: true
            },
            nextScheduled: {
                type: 'datetime',
                defaultsTo: null
            },
            lastStarted: {
                type: 'datetime',
                defaultsTo: null
            },
            lastFinished: {
                type: 'datetime',
                defaultsTo: null
            },
            leaseToken: {
                type: 'string',
                uuidv4: true,
                defaultsTo: null
            },
            leaseExpires: {
                type: 'datetime',
                defaultsTo: null
            },
            failureCount: {
                type: 'integer',
                defaultsTo: 0,
                required: true
            }
        },

        startNextScheduled: function startNextScheduled(leaseToken, criteria, leaseDuration) {
            var self = this;
            var now = new Date();
            return this.findOne({
                where: {
                    $and: [
                        criteria,
                        {
                            leaseToken: null,
                            $or: [
                                { nextScheduled: { lessThan: now } },
                                { nextScheduled: null }
                            ]
                        }
                    ]
                },
                sort: 'nextScheduled ASC'
            }).then(function (workItem) {
                if (!workItem) {
                    return;
                }
                return self.update({
                    id: workItem.id,
                    leaseToken: null,
                    $or: [
                        { nextScheduled: { lessThan: now } },
                        { nextScheduled: null }
                    ]
                },
                {
                    lastStarted: now,
                    leaseToken: leaseToken,
                    leaseExpires: new Date(now.valueOf() + leaseDuration)
                }).then(function (workItems) {
                    /* some other worker acquired the lease, so we request another
                     * work item to process. */
                    if (!workItems.length || workItems[0].leaseToken !== leaseToken) {
                        return self.startNextScheduled(leaseToken, criteria, leaseDuration);
                    }
                    return workItems[0];
                });
            });
        },

        findExpired: function findExpired(leaseExpiry) {
            return this.find({
                leaseExpires: { lessThan: leaseExpiry }
            });
        },

        setFailed: function setFailed(leaseToken, workItems) {
            var self = this;
            if (!Array.isArray(workItems)) {
                workItems = Array.prototype.slice.call(arguments, 1);
            }
            var now = new Date();
            return Promise.all(_.map(workItems, function (workItem) {
                return self.update({
                    id: workItem.id,
                    leaseToken: leaseToken || workItem.leaseToken
                }, {
                    nextScheduled: new Date(now.valueOf() + workItem.pollInterval),
                    failureCount: workItem.failureCount + 1,
                    lastFinished: now,
                    leaseToken: null,
                    leaseExpires: null
                });
            })).then(function (workItems) {
                return _.flatten(workItems);
            });
        },

        setSucceeded: function setSucceeded(leaseToken, workItems) {
            var self = this;
            if (!Array.isArray(workItems)) {
                workItems = Array.prototype.slice.call(arguments, 1);
            }
            var now = new Date();
            return Promise.all(_.map(workItems, function (workItem) {
                return self.update({
                    id: workItem.id,
                    leaseToken: leaseToken || workItem.leaseToken
                }, {
                    nextScheduled: new Date(now.valueOf() + workItem.pollInterval),
                    failureCount: 0,
                    lastFinished: now,
                    leaseToken: null,
                    leaseExpires: null
                });
            })).then(function (workItems) {
                return _.flatten(workItems);
            });
        },

        createIpmiPollers: function createIpmiPollers(nodeId) {
            return this.create([{
                name: Constants.WorkItems.Pollers.IPMI,
                node: nodeId,
                config: {
                    command: 'sdr'
                },
                pollInterval: 60 * 1000
            }, {
                name: Constants.WorkItems.Pollers.IPMI,
                node: nodeId,
                config: {
                    command: 'power'
                },
                pollInterval: 60 * 1000
            }, {
                name: Constants.WorkItems.Pollers.IPMI,
                node: nodeId,
                config: {
                    command: 'sel'
                },
                pollInterval: 60 * 1000
            }]);
        },

        findPollers: function findPollers(criteria) {
            return this.find({
                where: {
                    $and: [
                        criteria,
                        byPollers()
                    ]
                }
            });
        }
    });
}

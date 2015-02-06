// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = WorkItemModelFactory;

di.annotate(WorkItemModelFactory, new di.Provide('Models.WorkItem'));
di.annotate(WorkItemModelFactory, new di.Inject(
        'Model',
        '_',
        'Q',
        'Assert',
        'Constants'
    )
);

function WorkItemModelFactory (Model, _, Q, assert, Constants) {

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
                model: 'nodes'
            },
            config: {
                type: 'json'
            },
            pollInterval: {
                type: 'integer',
                required: true
            },
            nextScheduled: {
                type: 'datetime'
            },
            lastStarted: {
                type: 'datetime'
            },
            lastFinished: {
                type: 'datetime'
            },
            leaseToken: {
                type: 'string',
                uuidv4: true
            },
            leaseExpires: {
                type: 'datetime'
            },
            failureCount: {
                type: 'integer',
                defaultsTo: 0,
                required: true
            }
        },

        startNextScheduled: function startNextScheduled(leaseToken, criteria, leaseDuration) {
            var now = new Date();
            return this.update({
                where: _.assign({}, criteria, {
                    leaseToken: null
                }),
                limit: 1,
                sort: 'nextScheduled ASC'
            },
            {
                lastStarted: now,
                leaseToken: leaseToken,
                leaseExpires: new Date(now.valueOf() + leaseDuration)
            }).then(function (workItems) {
                if (workItems.length) {
                    assert(workItems.length === 1, 'workItems.length === 1');
                    return workItems[0];
                }
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
            return Q.all(_.map(workItems, function (workItem) {
                return self.update({
                    id: workItem.id,
                    leaseToken: leaseToken || workItem.leaseToken
                }, {
                    nextScheduled: now + workItem.pollInterval,
                    failureCount: workItem.failureCount + 1,
                    lastFinished: now,
                    leaseToken: null,
                    leaseExpires: null
                });
            }));
        },

        setSucceeded: function setSucceeded(leaseToken, workItems) {
            var self = this;
            if (!Array.isArray(workItems)) {
                workItems = Array.prototype.slice.call(arguments, 1);
            }
            var now = new Date();
            return Q.all(_.map(workItems, function (workItem) {
                return self.update({
                    id: workItem.id,
                    leaseToken: leaseToken || workItem.leaseToken
                }, {
                    nextScheduled: now + workItem.pollInterval,
                    failureCount: 0,
                    lastFinished: now,
                    leaseToken: null,
                    leaseExpires: null,
                });
            }));
        },

        createIpmiPollers: function createIpmiPollers(nodeId) {
            return this.create({
                name: Constants.WorkItems.Pollers.IPMI,
                node: nodeId,
                config: {
                    command: 'sdr'
                },
                pollInterval: 10 * 1000
            }, {
                name: Constants.WorkItems.Pollers.IPMI,
                node: nodeId,
                config: {
                    command: 'power'
                },
                pollInterval: 10 * 1000
            }, {
                name: Constants.WorkItems.Pollers.IPMI,
                node: nodeId,
                config: {
                    command: 'sel'
                },
                pollInterval: 10 * 1000
            });
        },

        findPollers: function findPollers(criteria) {
            return this.find({
                where: [byPollers(), criteria]
            });
        }
    });
}


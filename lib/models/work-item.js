// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = WorkItemModelFactory;

WorkItemModelFactory.$provide = 'Models.WorkItem';
WorkItemModelFactory.$inject = [
    'Model',
    '_',
    'Promise',
    'Assert',
    'Constants',
    'Services.Configuration',
    'Protocol.Events'
];

function WorkItemModelFactory (Model, _, Promise, assert, Constants, configuration, events) {

    function byPollers() {
        return {
            or: _.map(Constants.WorkItems.Pollers, function (pollerName) {
                return { name: pollerName };
            })
        };
    }

    function getAdjustedInterval(workitem) {
        return Math.min(
                workitem.pollInterval * Math.pow(2, workitem.failureCount + 1),
                (60 * 60 * 1000)
            );
    }

    return Model.extend({
        connection: configuration.get('taskgraph-store', 'mongo'),
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
            },
            paused:{
                type: 'boolean',
                defaultsTo: false
            },
            status:{
                type: 'string',
                defaultsTo: null
            },
            toJSON: function() {
                var obj = this.toObject();
                obj.config = _.omit(obj.config, function(value, key) {
                    return _.some(Constants.Logging.Redactions, function(pattern) {
                        return key.match(pattern);
                    });
                });
                return obj;
            }
        },

        startNextScheduled: function startNextScheduled(leaseToken, criteria, leaseDuration) {
            var self = this;
            var now = new Date();
            return this.findOne({
                where: {
                    $and: [
                        criteria,
                        { paused: false },
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
            })
            .then(function (workItem) {
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
                    return self.deserialize(workItems[0]);
                });
            });
        },

        findExpired: function findExpired(leaseExpiry) {
            return this.find({
                leaseExpires: { lessThan: leaseExpiry }
            });
        },

        setFailed: function setFailed(leaseToken, alertMessage, workItems) {
            var self = this;
            var newStatus = "inaccessible";
            if (!Array.isArray(workItems)) {
                workItems = Array.prototype.slice.call(arguments, 2);
            }
            var now = new Date();
            return Promise.all(_.map(workItems, function (workItem) {
                if (!alertMessage) {
                    newStatus = workItem.status;
                } else {
                    accessibleAlert(alertMessage, workItem, newStatus);
                }
                return self.update({
                    id: workItem.id,
                    leaseToken: leaseToken || workItem.leaseToken
                }, {
                    nextScheduled: new Date(now.valueOf() + getAdjustedInterval(workItem)),
                    failureCount: workItem.failureCount + 1,
                    lastFinished: now,
                    leaseToken: null,
                    leaseExpires: null,
                    status: newStatus
                });
            })).then(function (workItems) {
                return _.flattenDeep(workItems);
            });
        },

        setSucceeded: function setSucceeded(leaseToken, alertMessage, workItems) {
            var self = this;
            var newStatus = "accessible";
            if (!Array.isArray(workItems)) {
                workItems = Array.prototype.slice.call(arguments, 2);
            }
            var now = new Date();
            return Promise.all(_.map(workItems, function (workItem) {
                if (!alertMessage) {
                    newStatus = workItem.status;
                } else {
                    accessibleAlert(alertMessage, workItem, newStatus);
                }
                return self.update({
                    id: workItem.id,
                    leaseToken: leaseToken || workItem.leaseToken
                }, {
                    nextScheduled: new Date(now.valueOf() + workItem.pollInterval),
                    failureCount: 0,
                    lastFinished: now,
                    leaseToken: null,
                    leaseExpires: null,
                    status: newStatus 
                });
            })).then(function (workItems) {
                return _.flattenDeep(workItems);
            });
        },

        beforeValidate: function(obj, next) {
            if (obj.type && _(Constants.WorkItems.Pollers).has(obj.type.toUpperCase())) {
                obj.name = Constants.WorkItems.Pollers[obj.type.toUpperCase()];
                delete obj.type;
            }
            next();
        },

        beforeCreate: serialize,

        beforeUpdate: serialize,

        findPollers: function findPollers(criteria) {
            var self = this;
            return this.find({
                where: {
                    $and: [
                        criteria,
                        byPollers()
                    ]
                }
            })
            .then(function(pollers) {
                if (!Array.isArray(pollers)) {
                    pollers = Array.prototype.slice.call(arguments, 1);
                }
                return _.map(pollers, self.deserialize, self);
            });
        },

        deserialize: function(obj) {
            return sanitize(obj, /_/ig, '.');
        }
    });

    function sanitize(obj, search, replace) {
        if(!_.has(obj.config, 'oids')) {
            return obj;
        }
        obj.config.oids = _.map(obj.config.oids, function(oid) {
            return oid.replace(search, replace);
        });

        if(!obj.config.alerts) {
            return obj;
        }
        obj.config.alerts = _.map(obj.config.alerts, function(alertItem) {
            return _.transform(alertItem, function(result, alertVal, alertKey) {
                result[alertKey.replace(search, replace)] = alertVal;
            });
        });
        return obj;
    }

    function serialize(obj, next) {
        sanitize(obj, /\./ig, '_');
        return next();
    }

    function accessibleAlert(alertMessage, workitem, status) {
        assert.string(status);
        if (workitem.status !== status) {
            assert.object(alertMessage);
            var alertInfo = _.assign(
                {
                    nodeId: workitem.node,
                    status: status,
                    pollerType: workitem.type,
                    configure: workitem.config
                },
                alertMessage
            );
            return events.publishNodeAlert(workitem.node, alertInfo);
        }
    }

}


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
    'Protocol.Events',
    '$injector'
];

function WorkItemModelFactory (
    Model,
    _,
    Promise,
    assert,
    Constants,
    configuration,
    events,
    injector
) {
    var connection = configuration.get('taskgraph-store', 'mongo');

    // Every microservice references on-core and every microservice references all the models,
    // but only on-http and on-taskgraph reference the workflowInjectables where TaskGraph.Store
    // is contained.  Because of this, we cannot reference TaskGraph.Store directly in the $inject
    // list and have to pull it in here
    var taskGraphStore = injector._hasProviderFor('TaskGraph.Store') ? injector.get('TaskGraph.Store') : null;

    function getAdjustedInterval(workitem) {
        return Math.min(
                workitem.pollInterval * Math.pow(2, workitem.failureCount + 1),
                (60 * 60 * 1000)
            );
    }

    return Model.extend({
        connection: connection,
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
            state:{
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
            return taskGraphStore.checkoutTimer(leaseToken, criteria, leaseDuration)
            .then(function(workitem) {
                if(workitem) {
                    return self.deserialize(workitem);
                }
            });
        },

        findExpired: function findExpired(leaseExpiry) {
            return this.find({
                leaseExpires: { lessThan: leaseExpiry }
            });
        },

        setFailed: function setFailed(leaseToken, alertMessage, workItems) {
            var self = this;
            var newState = "inaccessible";
            if (!Array.isArray(workItems)) {
                workItems = Array.prototype.slice.call(arguments, 2);
            }
            var now = new Date();
            return Promise.map(workItems, function(workItem) {
                if (!alertMessage) {
                    newState = workItem.state;
                } else if (! _.isEmpty(alertMessage)){
                    accessibleAlert(alertMessage, newState);
                }
                var nextScheduled = new Date(now.valueOf() + getAdjustedInterval(workItem));
                return taskGraphStore.updatePollerStatus(workItem.id, {
                    status: Constants.Task.States.Failed, 
                    nextScheduled: nextScheduled, 
                    lastFinished: now,
                    state: newState
                });
            })
            .map(function (workItem) {
                return self.deserialize(workItem);
            })
            .then(function(workItems) {
                return _.flattenDeep(workItems);
            });
        },

        setSucceeded: function setSucceeded(leaseToken, alertMessage, workItems) {
            var self = this;
            var newState = "accessible";
            if (!Array.isArray(workItems)) {
                workItems = Array.prototype.slice.call(arguments, 2);
            }
            var now = new Date();
            return Promise.map(workItems, function (workItem) {
                if (!alertMessage) {
                    newState = workItem.state;
                } else if (!_.isEmpty(alertMessage)){
                    accessibleAlert(alertMessage, newState);
                }
                var nextScheduled = new Date(now.valueOf() + workItem.pollInterval);
                return taskGraphStore.updatePollerStatus(workItem.id, {
                    status: Constants.Task.States.Succeeded, 
                    nextScheduled: nextScheduled, 
                    lastFinished: now,
                    state: newState
                });
            })
            .map(function (workItem) {
                return self.deserialize(workItem);
            })
            .then(function(workItems) {
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
            return taskGraphStore.getPollers(criteria)
            .then(function(pollers) {
                if (!Array.isArray(pollers)) {
                    pollers = Array.prototype.slice.call(arguments, 1);
                }
                return _.map(pollers, self.deserialize, self);
            });
        },

        deserialize: function(obj) {
            if(obj._id && !obj.id) {
                obj.id = obj._id.toString();
                delete obj._id;
            }
            if(obj.node && typeof obj.node === 'object') {
                obj.node = obj.node.toString();
            }
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

    function accessibleAlert(alertMessage, state) {
        assert.string(state);
        assert.object(alertMessage);
        return events.publishNodeEvent(alertMessage.node, state);
    }

}


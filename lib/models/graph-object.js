// Copyright 2015, EMC, Inc.

'use strict';

module.exports = GraphModelFactory;

GraphModelFactory.$provide = 'Models.GraphObject';
GraphModelFactory.$inject = [
    'Model',
    'Constants',
    'Promise',
    '_'
];

function GraphModelFactory (Model, Constants, Promise, _) {
    return Model.extend({
        connection: 'mongo',
        identity: 'graphobjects',
        attributes: {
            instanceId: {
                type: 'string',
                required: true,
                unique: true,
                uuidv4: true
            },
            context: {
                type: 'json',
                required: true,
                json: true
            },
            definition: {
                type: 'json',
                required: true,
                json: true
            },
            tasks: {
                type: 'json',
                required: true,
                json: true
            },
            node: {
                model: 'nodes'
            },

            deserialize: function() {
                // Remove waterline keys that we don't want in our graph objects
                var obj = this.toObject();
                delete obj.createdAt;
                delete obj.updatedAt;
                delete obj.id;
                return obj;
            },

            checkGraphDone: function(graphId) {
                var query = {
                    instanceId: graphId,
                    state: 'valid',
                    tasks: {
                        // TODO: Handle tasks that will be unreachable
                        // based on separate success/failure waitOn dependencies
                        // for different tasks
                        state: { $nin: Constants.FinishedTaskStates }
                    }
                };
                return this.findMongo(query);
            },

            findReadyTasksForGraph: function(graphId) {
                var query = {
                    instanceId: graphId,
                    state: 'valid',
                    tasks: {
                        $elemMatch: {
                            waitingOn: []
                        }
                    }
                };
                return this.findMongo(query);
            },

            // TODO: serialize the waitOn data structure to be array based
            // so that these queries will work and can be indexed
            /*
            findReadyTasksForContext: function(contextId) {
                var query = {
                    state: 'valid',
                    tasks: {
                        $elemMatch: { }
                    }
                };
                query.$elemMatch['waitingOn.context-'+contextId] = { $exists: true };
                return this.findMongo(query);
            },
            */

            heartbeatTask: function(graphId, taskId, leaseId) {
                var query = {
                    instanceId: graphId,
                    state: 'valid',
                    tasks: {
                        leaseId: leaseId,
                        $elemMatch: {
                            instanceId: taskId
                        }
                    }
                };
                var update = {
                    $set: {
                        'task.$.heartbeat': new Date()
                    }
                };
                var sort = {
                    'updatedAt': -1
                };
                var options = {
                    new: true
                };

                return this.findAndModifyMongo(query, sort, update, options);
            },

            checkoutTask: function(schedulerLeaseId, task) {
                var query = {
                    leaseId: null,
                    instanceId: task.instanceId
                };
                var update = {
                    $set: {
                        'schedulerLeaseId': schedulerLeaseId
                    }
                };
                var options = {
                    new: true
                };

                return this.findAndModifyMongo(query, update, options);
            },

            checkoutTaskForRunner: function(runnerLeaseId, task) {
                var query = {
                    runnerLeaseId: null,
                    instanceId: task.instanceId
                };
                var update = {
                    $set: {
                        'runnerLeaseId': runnerLeaseId
                    }
                };
                var options = {
                    new: true
                };

                return this.findAndModifyMongo(query, update, options);
            },

            scheduleReadyTasks: function(tasks, observable) {
                var self = this;
                _.forEach(tasks, function(task) {
                    self.checkoutTask(task.context.graphId, task.instanceId)
                    .then(observable.onNext)
                    .catch(function(error) {
                        error;
                        // log error
                    });
                });
            },

            // TODO: change this: update for new waitingOn array
            updateTaskDependencies: function(dependency, value, graphId) {
                var findQuery = {
                    state: 'valid',
                    tasks: {
                        $elemMatch: {
                            waitingOn: { }
                        }
                    }
                };
                if (graphId) {
                    findQuery.instanceId = graphId;
                }
                // TODO: add $contains/$in for finished states
                findQuery.tasks.$elemMatch.waitingOn[dependency] = value;

                var updateQuery = {
                    $unset: {
                        'tasks.$.waitingOn': { }
                    }
                };
                updateQuery.$unset.tasks.$.waitingOn[dependency] = "";

                var options = {
                    new: true
                };

                return this.updateManyMongo(findQuery, updateQuery, options);
            }
        }
    });
}

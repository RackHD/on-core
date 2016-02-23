// Copyright 2015, EMC, Inc.
'use strict';

module.exports = mongoStoreFactory;
mongoStoreFactory.$provide = 'TaskGraph.Stores.Mongo';
mongoStoreFactory.$inject = [
    'Services.Waterline',
    'Promise',
    'Constants',
    'Errors',
    'Assert',
    '_'
];

function mongoStoreFactory(waterline, Promise, Constants, Errors, assert, _) {
    var exports = {};

    // NOTE: This is meant to be idempotent, and just drop the update silently
    // if the graph has already been marked as done elsewhere and the query returns
    // empty.
    /**
     * Atomically sets the graph document in the graphobjects collection given by data.graphId
     * to the given state
     * @param {String} state - the finished state to set the graph to
     * @param {Object} data
     * @param {String} data.graphId - the graphId of the graph to be set to done
     * @memberOf store
     * @returns {Promise} - a promise for the graph after its state has been set
     */
    exports.setGraphDone = function(state, data) {
        assert.string(state, 'state');
        assert.object(data, 'data');
        assert.uuid(data.graphId, 'data.graphId');

        var query = {
            instanceId: data.graphId,
            _status: Constants.Task.States.Pending
        };
        var update = {
            $set: {
                _status: state
            }
        };
        var options = {
            new: true
        };

        return waterline.graphobjects.findAndModifyMongo(query, {}, update, options);
    };

    /**
     * @param {Object} indexObject an object with keys that correspond to the mogo
     * collections on which to place indexes and values that are arrays of indexes
     * @example {
     *          taskdependencies: [
     *              {taskId: 1},
     *              {graphId: 1},
     *              {taskId: 1, graphId: 1}
     *          ],
     *          graphobjects: [
     *              {instanceId: 1}
     *          ]
     *  }
     * @memberOf store
     * @returns {Promise}
     */
    exports.setIndexes = function(indexObject) {
        return Promise.all(_.flatten(_.map(indexObject, function(indexObj, key) {
                return _.map(indexObj, function(index) {
                    return waterline[key].createMongoIndexes(index);
                });
            }))
        );
    };

    /**
     * Sets the state of a reachable, matching task in the taskdependencies collection
     * and updates the task's context.
     * @param {Object} task - a task object
     * @param {String} task.graphId - the unique ID of the graph to which the task belongs
     * @param {Object} task.context - the task context object
     * @param {String} task.state - the state with which to update the task document
     * in the database
     * @memberOf store
     * @returns {Promise}
     */
    exports.setTaskState = function(task) {
        assert.uuid(task.taskId, 'taskId');
        assert.uuid(task.graphId, 'task.graphId');
        assert.string(task.state, 'task.state');
        assert.optionalObject(task.context, 'task.context');
        // TODO: including graphId with the intent that we'll create an
        // index against it in the database

        if(task.state !== Constants.Task.States.Succeeded){
            task.context = null;
        }
        var query = {
            graphId: task.graphId,
            taskId: task.taskId,
            reachable: true
        };
        var update = {
            $set: {
                state: task.state,
                context: task.context
            }
        };
        var options = {
            multi: true
        };

        return waterline.taskdependencies.updateMongo(query, update, options);
    };

    /**
     * Atomically sets the state of a task in the graphobjects collection
     * @param {Object} data
     * @param {String} data.taskId - the unique ID of the task
     * @param {String} data.graphId - the unique ID of the graph to which the task belongs
     * @param {String} task.state - the state with which to update the task subdocument
     * @memberOf store
     * @returns {Promise} - a promise for the graph document containing the task
     */
    exports.setTaskStateInGraph = function(data) {
        assert.uuid(data.taskId, 'data.taskId');
        assert.uuid(data.graphId, 'data.graphId');
        assert.string(data.state, 'data.state');

        // TODO: including graphId with the intent that we'll create an
        // index against it in the database
        var query = {
            instanceId: data.graphId
        };
        var update = {
            $set: {}
        };

        var _key = ['tasks', data.taskId, 'state'].join('.');
        update.$set[_key] = data.state;
        _.forEach(data.context, function(val, key) {
            update.$set[['context', key].join('.')] = val;
        });
        var options = {
            new: true
        };

        return waterline.graphobjects.findAndModifyMongo(query, {}, update, options);
    };

    /**
     * Get the definition of a task from the taskdefinitions collection
     * @param {String} injectableName - the injectable name for the desired task
     * @returns {Promise} - a promise for the definition for the desired task
     * @memberOf store
     */
    exports.getTaskDefinition = function(injectableName) {
        return waterline.taskdefinitions.findOne({ injectableName: injectableName })
        .then(function(taskDefinition) {
            if (_.isEmpty(taskDefinition)) {
                throw new Errors.NotFoundError(
                    'Could not find task definition with injectableName %s'
                    .format(injectableName));
            }

            return taskDefinition.toJSON();
        });
    };

    /**
     * Persists a graph definition ot the graphdefinitions collection
     * @param {Object} definition - the graph definition to persist
     * @returns {Promise} a promise for the persisted graph definition object
     * @memberOf store
     */
    exports.persistGraphDefinition = function(definition) {
        assert.object(definition, 'definition');
        assert.string(definition.injectableName, 'definition.injectableName');

        var query = {
            injectableName: definition.injectableName
        };
        var options = {
            new: true,
            upsert: true
        };

        return waterline.graphdefinitions.findAndModifyMongo(query, {}, definition, options);
    };

    /**
     * Persists a task definition ot the taskdefinitions collection
     * @param {Object} definition - the task definition to persist
     * @returns {Promise} a promise for the persisted task definition object
     * @memberOf store
     */
    exports.persistTaskDefinition = function(definition) {
        assert.object(definition, 'definition');
        assert.string(definition.injectableName, 'definition.injectableName');

        var query = {
            injectableName: definition.injectableName
        };
        var options = {
            new: true,
            upsert: true
        };

        return waterline.taskdefinitions.findAndModifyMongo(query, {}, definition, options);
    };

    /**
     * Gets one or all graph definitions from the graphdefinitions collection
     * @param {String=} injectableName - an optional injectableName for the desired
     * graph definition
     * @returns {Promise} a promise for the matching graph definition or
     * all graph definitions if no injectableName was given
     * @memberOf store
     */
    exports.getGraphDefinitions = function(injectableName) {
        var query = {};
        if (injectableName) {
            query.injectableName = injectableName;
        }
        return waterline.graphdefinitions.find(query)
        .then(function(graphs) {
            return _.map(graphs, function(graph) {
                return graph.toJSON();
            });
        });
    };

    /**
     * Gets one or all task definitions from the taskdefinitions collection
     * @param {String=} injectableName - an optional injectableName for the desired
     * task definition
     * @returns {Promise} a promise for the matching task definition or
     * all task definitions if no injectableName was given
     * @memberOf store
     */
    exports.getTaskDefinitions = function(injectableName) {
        var query = {};
        if (injectableName) {
            query.injectableName = injectableName;
        }
        return waterline.taskdefinitions.find(query);
    };

    /**
     * Persists a graph to the graphobjects collection
     * @param {Object} graph - the graph object to persist
     * @param {String} graph.instanceId - the unique ID for the graph instance
     * @returns {Promise} a promise for the persisted graph object
     * @memberOf store
     */
    exports.persistGraphObject = function(graph) {
        assert.object(graph, 'graph');
        assert.uuid(graph.instanceId, 'graph.instanceId');

        if (graph.node) {
            graph.node = waterline.taskdependencies.mongo.objectId(graph.node);
        }

        var query = {
            instanceId: graph.instanceId
        };
        var options = {
            new: true,
            upsert: true,
            fields: {
                _id: 0,
                instanceId: 1
            }
        };

        return waterline.graphobjects.findAndModifyMongo(query, {}, graph, options);
    };

    /**
     * Persists a task object and its dependencies to the taskdependencies collection
     * @param {Object} taskDependencyItem - the task object
     * @param {String} taskDependencyItem.taskId - the unique ID for the task
     * @param {Object} taskDependencyItem.dependencies - the list of dependencies for the task
     * @param {String[]} taskDependencyItem.terminalOnStates - the list of states for which this task
     * can be the last task in its graph
     * @param {String} graphId - the unique ID of the graph to which the task belongs
     * @returns {Promise} a promise for the created taskdependency object
     * @memberOf store
     */
    exports.persistTaskDependencies = function(taskDependencyItem, graphId) {
        assert.object(taskDependencyItem, 'taskDependencyItem');
        assert.uuid(taskDependencyItem.taskId, 'taskDependencyItem.taskId');
        assert.uuid(graphId, 'graphId');
        assert.object(taskDependencyItem.dependencies, 'taskDependencyItem.dependencies');
        assert.arrayOfString(
                taskDependencyItem.terminalOnStates, 'taskDependencyItem.terminalOnStates');

        var obj = {
            taskId: taskDependencyItem.taskId,
            graphId: graphId,
            state: Constants.Task.States.Pending,
            dependencies: taskDependencyItem.dependencies,
            terminalOnStates: taskDependencyItem.terminalOnStates
        };

        return waterline.taskdependencies.create(obj);
    };

    /**
     * Gets a task subdocument from the graphobjects collection
     * @param {Object} data
     * @param {String} data.graphId - the unique ID of the graph to which the task belongs
     * @param {String} data.taskId - the unique ID of the desired task subdocument
     * @returns {Promise} a promise for an object containing the graphId, requested task
     * and the associated graph context
     * @memberOf store
     */
    exports.getTaskById = function(data) {
        assert.object(data, 'data');
        assert.uuid(data.graphId, 'data.graphId');
        assert.uuid(data.taskId, 'data.taskId');

        var query = {
            instanceId: data.graphId
        };
        var options = {
            fields: {
                _id: 0,
                instanceId: 1,
                context: 1,
                tasks: {}
            }
        };
        options.fields.tasks[data.taskId] = 1;

        return waterline.graphobjects.findOne(query, options)
        .then(function(graph) {
            return {
                graphId: graph.instanceId,
                context: graph.context,
                task: graph.tasks[data.taskId]
            };
        });
    };

    /**
     * Gets graphs with the attribute 'serviceGraph' marked true from the
     * graphobjects collection
     * @returns {Promise} a promise for the marked serivice graphs
     * @memberOf store
     */
    exports.getServiceGraphs = function() {
        var query = {
            serviceGraph: true
        };

        return waterline.graphobjects.find(query)
        .then(function(graphs) {
            return _.map(graphs, function(graph) {
                return graph.toJSON();
            });
        });
    };

    /**
     * Updates the lease/heartbeat for all tasks in the taskdependencies collection
     *  with the given lease
     * @param {String} leaseId - the taskRunner ID to match against the
     *  taskRunnerLease document field when updating heartbeats
     * @returns {Promise} a promise containing the number of updated leases
     * @memberOf store
     */
    exports.heartbeatTasksForRunner = function(leaseId) {
        assert.uuid(leaseId, 'leaseId');

        var query = {
            taskRunnerLease: leaseId,
            reachable: true,
            state: Constants.Task.States.Pending
        };
        var update = {
            $set: {
                taskRunnerLease: leaseId,
                taskRunnerHeartbeat: new Date()
            }
        };
        var options = {
            multi: true
        };

        return waterline.taskdependencies.updateMongo(query, update, options);
    };

    /**
     * Gets all tasks that match the given leaseId
     * @param {String} leaseId - the leaseId to match against the taskRunnerLease document field
     * @returns {Promise} a promise for the matching tasks from the taskdependencies collection
     * @memberOf store
     */
    exports.getOwnTasks = function(leaseId) {
        assert.uuid(leaseId, 'leaseId');

        var query = {
            where: {
                taskRunnerLease: leaseId,
                reachable: true,
                state: Constants.Task.States.Pending
            }
        };

        return waterline.taskdependencies.find(query);
    };

    /**
     * Gets the active graph associated with a nodeId
     * @param {String} target - the node Id for which to return active graphs
     * @returns {Promise} a promise for a graph object
     * @memberOf store
     */
    exports.findActiveGraphForTarget = function(target) {
        if (!target) {
            return Promise.resolve(null);
        }
        assert.string(target, 'target');

        var query = {
            "context.target": target,
            _status: Constants.Task.States.Pending
        };

        return waterline.graphobjects.findOneMongo(query);
    };
    /**
     * Gets all the active graphs within a given domain
     * @param {String} domain - the domain to get all active graphs for
     * @returns {Promise} a promise for all active graphs in the given domain
     * @memberOf store
     */
    exports.findActiveGraphs = function(domain) {
        assert.string(domain, 'domain');

        var query = {
            domain: domain,
            _status: Constants.Task.States.Pending
        };

        return waterline.graphobjects.find(query);
    };

    /**
     * Gets all tasks for a given domain that are finished but unevaluated from
     * the taskdependencies collection
     * @param {String} domain - the domain to get tasks from
     * @param {Number=} limit - an option limit on the number of tasks to return
     * @returns {Promise} a promise for the matching task objects
     * @memberOf store
     */
    exports.findUnevaluatedTasks = function(domain, limit) {
        assert.string(domain, 'domain');

        if (limit) {
            assert.number(limit, 'limit');
        }

        var query = {
            domain: domain,
            evaluated: false,
            reachable: true,
            state: {
                $in: Constants.Task.FinishedStates
            }
        };

        var promise = waterline.taskdependencies.find(query);
        if (limit) {
            promise.limit(limit);
        }
        return promise.then(function(tasks) {
            return _.map(tasks, function(task) {
                return task.toJSON();
            });
        });
    };

    /**
    * Gets all tasks for a given domain and graph that are ready to run from the
    * taskdependencies collection
    * @param {String} domain - the domain to get tasks from
    * @param {String=} graphId - the unique ID for the graph to fetch ready tasks from
    * @returns {Promise} a promise for the ready tasks
    * @memberOf store
    */
    exports.findReadyTasks = function(domain, graphId) {
        assert.string(domain, 'domain');

        if (graphId) {
            assert.uuid(graphId, 'graphId');
        }

        var query = {
            taskRunnerLease: null,
            domain: domain,
            dependencies: {},
            reachable: true,
            state: Constants.Task.States.Pending
        };
        if (graphId) {
            query.graphId = graphId;
        }

        return waterline.taskdependencies.find(query)
        .then(function(tasks) {
            return {
                tasks: _.map(tasks, function(task) { return task.toJSON(); }),
                graphId: graphId || null
            };
        });
    };

    /**
     * Atomically check out a taskdependencies task document by marking it's lease with
     * the given taskRunner ID and setting the taskRunnerHeartbeat field to 'now'
     * @param {String} taskRunnerId - the unique ID of the taskRunner for which the
     * task is being checked out
     * @param {Object} data
     * @param {String} data.graphId - the unique ID of the graph to which the task belongs
     * @param {String} data.taskId - the unique ID of the task to be checked out
     * @returns {Promise} a promise for the checked out task
     * @memberOf store
     */
    exports.checkoutTask = function(taskRunnerId, data) {
        assert.object(data, 'data');
        assert.uuid(data.graphId, 'data.graphId');
        assert.uuid(data.taskId, 'data.taskId');

        var query = {
            graphId: data.graphId,
            taskId: data.taskId,
            taskRunnerLease: null,
            dependencies: {},
            reachable: true
        };
        var update = {
            $set: {
                taskRunnerLease: taskRunnerId,
                taskRunnerHeartbeat: new Date()
            }
        };
        var options = {
            new: true
        };

        return waterline.taskdependencies.findAndModifyMongo(query, {}, update, options);
    };

    /**
     * Checks whether there are any pending, reachable, tasks corresponding to
     * the given graph ID.
     * @param {Object} data
     * @param {String} data.graphId - The uniqe ID of the graph to be checked
     * @retuns {Promise} a promise for an object with a boolean 'done' field
     * @memberOf store
     */
    exports.checkGraphFinished = function(data) {
        assert.object(data, 'data');
        assert.uuid(data.graphId, 'data.graphId');

        var query = {
            graphId: data.graphId,
            state: Constants.Task.States.Pending,
            reachable: true
        };

        return waterline.taskdependencies.findOne(query)
        .then(function(result) {
            if (_.isEmpty(result)) {
                data.done = true;
            } else {
                data.done = false;
            }
            return data;
        });
    };

    /**
     * Updates the tasks dependant on the given task ID to reflect its new, finished
     * state in the taskdependencies collection
     * @param {Object} data - the task data object
     * @param {String} data.taskId - the unique ID of the task whose dependencies
     * should be updated
     * @param {String} data.graphId - the unique ID of the graph to which the task
     * belongs
     * @returns {Promise} a promise for the number of updated task documents
     * @memberOf store
     */
    exports.updateDependentTasks = function(data) {
        assert.object(data, 'data');
        assert.uuid(data.graphId, 'data.graphId');
        assert.uuid(data.taskId, 'data.taskId');
        assert.string(data.state, 'data.state');

        var query = {
            graphId: data.graphId,
            reachable: true
        };
        query['dependencies.' + data.taskId] = {
            $in: [data.state, Constants.Task.States.Finished]
        };
        var update = {
            $unset: {}
        };
        update.$unset['dependencies.' + data.taskId] = '';
        var options = {
            multi: true
        };

        return waterline.taskdependencies.updateMongo(query, update, options);
    };

    /**
     * Updates tasks which will no longer be reachable as a result of the given
     * task's state so that they are marked as unreachable in the taskdependencies
     * collection
     * @param {Object} data - the task data object
     * @param {String} data.taskId - the unique ID of the task whose dependencies
     * should be updated
     * @param {String} data.graphId - the unique ID of the graph to which the task
     * belongs
     * @returns {Promise} a promise for the number of updated task documents
     * @memberOf store
     */
    exports.updateUnreachableTasks = function(data) {
        assert.object(data, 'data');
        assert.uuid(data.graphId, 'data.graphId');
        assert.uuid(data.taskId, 'data.taskId');
        assert.string(data.state, 'data.state');

        var query = {
            graphId: data.graphId,
            reachable: true
        };
        query['dependencies.' + data.taskId] = {
            $in: _.difference(Constants.Task.FinishedStates, [data.state])
        };
        var update = {
            $set: {
                reachable: false
            }
        };
        var options = {
            multi: true
        };

        return waterline.taskdependencies.updateMongo(query, update, options);
    };

    /**
     * Marks the given task document's evaluated field to true in the taskdependencies
     * collection
     * @param {Object} data
     * @param {String} data.taskId - the unique ID for the task which should be marked
     * evaluated
     * @param {String} data.graphId - the unique ID of the graph to which the task
     * belongs
     * @returns {Promise} a promise for the new, updated, task document
     * @memberOf store
     */
    exports.markTaskEvaluated = function(data) {
        assert.object(data, 'data');
        assert.uuid(data.graphId, 'data.graphId');
        assert.uuid(data.taskId, 'data.taskId');

        var query = {
            graphId: data.graphId,
            taskId: data.taskId,
            reachable: true
        };
        var update = {
            $set: {
                evaluated: true
            }
        };
        var options = {
            new: true
        };

        return waterline.taskdependencies.findAndModifyMongo(query, {}, update, options);
    };

    /**
     * Finds all reachable taskdependencies documents whose leases are more than the given
     * leaseAdjust milliseconds old
     * @param {String} domain - the domain to restrict the search to
     * @param {Number} leaseAdjust - the time after which to consier a lease expired in milliseconds
     * @returns {Promise} a promise for all taskdependencies documents whose leases are
     * expired according to the given leaseAdjst
     * @memberOf store
     */
    exports.findExpiredLeases = function(domain, leaseAdjust) {
        assert.string(domain, 'domain');
        assert.number(leaseAdjust, 'leaseAdjust');

        var query = {
            domain: domain,
            reachable: true,
            taskRunnerLease: { $ne: null },
            taskRunnerHeartbeat: {
                $lt: new Date(Date.now() - leaseAdjust)
            },
            state: Constants.Task.States.Pending
        };

        return waterline.taskdependencies.find(query);
    };

    /**
     * Expires the lease on a taskdependencies object by setting taskRunnerLease and
     * taskRunnerHeartbeat fields to null
     * @param {String} objId - the mongo ID for a taskdependencies document
     * @returns {Promise} a promise for the taskdependencies document with expried lease
     * @memberOf store
     */
    exports.expireLease = function(objId) {
        assert.string(objId, 'objId');

        var query = {
            _id: waterline.taskdependencies.mongo.objectId(objId)
        };
        var update = {
            $set: {
                taskRunnerLease: null,
                taskRunnerHeartbeat: null
            }
        };
        var options = {
            new: false
        };

        return waterline.taskdependencies.findAndModifyMongo(query, {}, update, options);
    };

    /**
     * Find all taskdependencies documents that are unreachable or in a finished state
     * @param {Number=} limit - an optional limit to the number of documents returned
     * @returns {Promise} a promise for all complete or unreachable tasks
     * @memberOf store
     */
    exports.findCompletedTasks = function(limit) {
        var query = {
            $or: [
                {
                    evaluated: true,
                    state: {
                        $in: Constants.Task.FinishedStates
                    }
                },
                { reachable: false }
            ]
        };
        var options = {};
        // Limit may be undefined or null, so do a non-strict equality check
        if (limit != null) {  /* jshint ignore:line */
            options.limit = limit;
        }

        return waterline.taskdependencies.findMongo(query, options);
    };

    /**
     * Deletes the taskdependencies documents by given mongo IDs
     * @param {String[]} an array of mongo objct IDs for the documents to be deleted
     * @returns {Promise}
     * @memberOf store
     */
    exports.deleteTasks = function(objectIds) {
        var ids = _.map(objectIds, waterline.taskdependencies.mongo.objectId);

        var query = {
            _id: {
                $in: ids
            }
        };

        return waterline.taskdependencies.removeMongo(query);
    };

    /**
     * Deletes a given graph by graphId from the graphobjects collection
     * @param {String} graphId - the unique ID for the graph to be deleted
     * @returns {Promise}
     * @memberOf store
     */
    exports.deleteGraph = function(graphId) {
        var query = {
            instanceId: graphId
        };

        return waterline.graphobjects.destroy(query);
    };

    /**
     * Finds one graph document with state 'Pending' by graphId
     * @param {String} graphId - the unique ID of the desired active graph
     * @returns {Promise} a promise for the graph with the given graphId
     * @memberOf store
     */
    exports.getActiveGraphById = function(graphId) {
        assert.uuid(graphId);

        var query = {
            instanceId: graphId,
            _status: Constants.Task.States.Pending
        };

        return waterline.graphobjects.findOne(query);
    };

    return exports;
}

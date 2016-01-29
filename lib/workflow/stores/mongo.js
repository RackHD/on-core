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
    exports.setGraphDone = function(state, data) {
        assert.string(state, 'state');
        assert.object(data, 'data');
        assert.uuid(data.graphId, 'data.graphId');

        var query = {
            instanceId: data.graphId,
            _status: Constants.TaskStates.Pending
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

    exports.setTaskState = function(taskId, graphId, state, context) {
        assert.uuid(taskId, 'taskId');
        assert.uuid(graphId, 'graphId');
        assert.string(state, 'state');
        // TODO: including graphId with the intent that we'll create an
        // index against it in the database

        if(state !== Constants.TaskStates.Succeeded){
            context = null;
        }
        var query = {
            graphId: graphId,
            taskId: taskId,
            reachable: true
        };
        var update = {
            $set: {
                state: state,
                context: context
            }
        };
        var options = {
            multi: true
        };

        return waterline.taskdependencies.updateMongo(query, update, options);
    };

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
        _.forEach(data.context, function(val, key) {
            update.$set[['context', key].join('.')] = val;
        });
        update.$set[_key] = data.state;
        var options = {
            new: true
        };

        return waterline.graphobjects.findAndModifyMongo(query, {}, update, options);
    };

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

    exports.getGraphDefinitions = function() {
        return waterline.graphdefinitions.find({});
    };

    exports.getTaskDefinitions = function() {
        return waterline.taskdefinitions.find({});
    };

    exports.persistGraphObject = function(graph) {
        assert.object(graph, 'graph');
        assert.uuid(graph.instanceId, 'graph.instanceId');

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
            state: Constants.TaskStates.Pending,
            dependencies: taskDependencyItem.dependencies,
            terminalOnStates: taskDependencyItem.terminalOnStates
        };

        return waterline.taskdependencies.create(obj);
    };

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

    exports.heartbeatTasksForRunner = function(leaseId) {
        assert.uuid(leaseId, 'leaseId');

        var query = {
            taskRunnerLease: leaseId,
            reachable: true,
            state: Constants.TaskStates.Pending
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

    exports.getOwnTasks = function(leaseId) {
        assert.uuid(leaseId, 'leaseId');

        var query = {
            where: {
                taskRunnerLease: leaseId,
                reachable: true,
                state: Constants.TaskStates.Pending
            }
        };

        return waterline.taskdependencies.find(query);
    };

    exports.findActiveGraphs = function(domain) {
        assert.string(domain, 'domain');

        var query = {
            domain: domain,
            _status: Constants.TaskStates.Pending
        };

        return waterline.graphobjects.find(query);
    };

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
                $in: Constants.FinishedTaskStates
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
            state: Constants.TaskStates.Pending
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

    exports.checkGraphFinished = function(data) {
        assert.object(data, 'data');
        assert.uuid(data.graphId, 'data.graphId');

        var query = {
            graphId: data.graphId,
            state: Constants.TaskStates.Pending,
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
            $in: [data.state, Constants.TaskStates.Finished]
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
            $in: _.difference(Constants.FinishedTaskStates, [data.state])
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
            state: Constants.TaskStates.Pending
        };

        return waterline.taskdependencies.find(query);
    };

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

    exports.findCompletedTasks = function(limit) {
        var query = {
            $or: [
                {
                    evaluated: true,
                    state: {
                        $in: Constants.FinishedTaskStates
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

    exports.deleteTasks = function(objectIds) {
        var ids = _.map(objectIds, waterline.taskdependencies.mongo.objectId);

        var query = {
            _id: {
                $in: ids
            }
        };

        return waterline.taskdependencies.removeMongo(query);
    };

    return exports;
}

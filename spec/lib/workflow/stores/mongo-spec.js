// Copyright 2016, EMC, Inc.

'use strict';

describe('Task Graph mongo store interface', function () {
    var mongo;
    var waterline;
    var Constants;
    var Errors;
    var uuid;

    var createMockModel = function() {
        return {
            publishRecord: sinon.stub(),
            findMongo: sinon.stub().resolves(),
            findOneMongo: sinon.stub().resolves(),
            needOneMongo: sinon.stub().resolves(),
            findAndModifyMongo: sinon.stub().resolves(),
            updateMongo: sinon.stub().resolves(),
            removeMongo: sinon.stub().resolves(),
            needOne: sinon.stub().resolves(),
            findOne: sinon.stub().resolves(),
            find: sinon.stub().resolves(),
            create: sinon.stub().resolves(),
            createMongoIndexes: sinon.stub().resolves(),
            destroy: sinon.stub().resolves(),
            mongo: { objectId: sinon.stub() }
        };
    };
    var waterlineMock = {
        graphobjects: createMockModel(),
        taskdependencies: createMockModel(),
        taskdefinitions: createMockModel(),
        graphdefinitions: createMockModel()
    };

    before(function() {
        helper.setupInjector([
            helper.require('/lib/workflow/stores/mongo'),
            helper.di.simpleWrapper(waterlineMock, 'Services.Waterline')
        ]);
        mongo = helper.injector.get('TaskGraph.Stores.Mongo');
        waterline = helper.injector.get('Services.Waterline');
        Constants = helper.injector.get('Constants');
        Errors = helper.injector.get('Errors');
        uuid = helper.injector.get('uuid');
    });

    afterEach(function() {
        _.forEach(waterline, function(model) {
            _.forEach(model, function(method) {
                if (method.reset) {
                    method.reset();
                } else {
                    method.objectId.reset();
                }
            });
        });
    });

    it('setGraphDone', function() {
        var state = 'succeeded';
        var data = {
            graphId: uuid.v4()
        };

        return mongo.setGraphDone(state, data)
        .then(function() {
            expect(waterline.graphobjects.findAndModifyMongo).to.have.been.calledOnce;
            expect(waterline.graphobjects.findAndModifyMongo).to.have.been.calledWith(
                { instanceId: data.graphId, _status: {$in: Constants.Task.ActiveStates} },
                {},
                { $set: { _status: 'succeeded' } },
                { new: true }
            );
        });
    });

    it('setTaskState', function() {
        var task = {
            state: 'succeeded',
            taskId: uuid.v4(),
            graphId: uuid.v4(),
            context: {}
        };

        return mongo.setTaskState(task)
        .then(function() {
            expect(waterline.taskdependencies.updateMongo).to.have.been.calledOnce;
            expect(waterline.taskdependencies.updateMongo).to.have.been.calledWith(
                {
                    taskId: task.taskId,
                    graphId: task.graphId,
                    reachable: true
                },
                { $set: { state: 'succeeded', context: {} } },
                { multi: true }
            );
        });
    });

    describe('setTaskStateInGraph', function() {
        it('should set a task state within a graph object', function() {
            var data = {
                state: 'succeeded',
                taskId: uuid.v4(),
                graphId: uuid.v4()
            };

            var timeStamp = new Date();

            return mongo.setTaskStateInGraph(data).then(function(){
                var modify = { $set: {} };
                modify.$set['tasks.' + data.taskId + '.state'] = 'succeeded';
                modify.$set.taskEndTime = timeStamp;
                expect(waterline.graphobjects.findAndModifyMongo).to.have.been.calledOnce;
                expect(waterline.graphobjects.findAndModifyMongo.args[0][0]).to.deep.equal(
                    {instanceId: data.graphId});
                expect(waterline.graphobjects.findAndModifyMongo.args[0][1]).to.deep.equal({});
                expect(waterline.graphobjects.findAndModifyMongo.args[0][3]).to.deep.equal(
                    {new: true});
                expect(waterline.graphobjects.findAndModifyMongo.args[0][2].$set).to.have
                .property('tasks.' + data.taskId + '.state').to.deep.equal('succeeded');
                expect(waterline.graphobjects.findAndModifyMongo.args[0][2].$set).to.have
                .property('tasks.' + data.taskId + '.taskEndTime').that.is.an.instanceof(Date);
            });
        });

        it('should set a task state and error within a graph object', function() {
            var data = {
                state: 'succeeded',
                error: new Error('test error message').toString(),
                taskId: uuid.v4(),
                graphId: uuid.v4()
            };
            var timeStamp = new Date();

            return mongo.setTaskStateInGraph(data).then(function(){
                var modify = { $set: {} };
                modify.$set['tasks.' + data.taskId + '.state'] = 'succeeded';
                modify.$set.taskEndTime = timeStamp;
                expect(waterline.graphobjects.findAndModifyMongo).to.have.been.calledOnce;
                expect(waterline.graphobjects.findAndModifyMongo.args[0][0]).to.deep.equal(
                    {instanceId: data.graphId});
                expect(waterline.graphobjects.findAndModifyMongo.args[0][1]).to.deep.equal({});
                expect(waterline.graphobjects.findAndModifyMongo.args[0][3]).to.deep.equal(
                    {new: true});
                expect(waterline.graphobjects.findAndModifyMongo.args[0][2].$set).to.have
                .property('tasks.' + data.taskId + '.state').to.deep.equal('succeeded');
                expect(waterline.graphobjects.findAndModifyMongo.args[0][2].$set).to.have
                .property('tasks.' + data.taskId + '.taskEndTime').that.is.an.instanceof(Date);
            });

/*            return mongo.setTaskStateInGraph(data)
            .then(function() {
                var modify = { $set: {} };
                modify.$set['tasks.' + data.taskId + '.state'] = 'succeeded';
                modify.$set['tasks.' + data.taskId + '.error'] = 'Error: test error message';
                expect(waterline.graphobjects.findAndModifyMongo).to.have.been.calledOnce;
                expect(waterline.graphobjects.findAndModifyMongo).to.have.been.calledWith(
                    {
                        instanceId: data.graphId
                    },
                    {},
                    modify,
                    { new: true }
                );
            });*/

        });
    });

    it('getTaskDefinition', function() {
        var task = { injectableName: 'testname' };
        task.toJSON = function() { return this; };
        waterline.taskdefinitions.findOne.resolves(task);
        return mongo.getTaskDefinition('testname')
        .then(function(_task) {
            expect(waterline.taskdefinitions.findOne).to.have.been.calledOnce;
            expect(waterline.taskdefinitions.findOne).to.have.been.calledWith(
                { injectableName: 'testname' }
            );
            expect(_task).to.equal(task);
        });
    });

    it('getTaskDefinition should fail on an empty result', function() {
        waterline.taskdefinitions.findOne.resolves(undefined);
        return expect(mongo.getTaskDefinition('testname')).to.be.rejectedWith(
            Errors.NotFoundError, 'Could not find task definition with injectableName testname');
    });

    it('persistGraphDefinition', function() {
        var definition = {
            injectableName: 'testname'
        };

        return mongo.persistGraphDefinition(definition)
        .then(function() {
            expect(waterline.graphdefinitions.findAndModifyMongo).to.have.been.calledOnce;
            expect(waterline.graphdefinitions.findAndModifyMongo).to.have.been.calledWith(
                {
                    injectableName: 'testname'
                },
                {},
                definition,
                { new: true, upsert: true }
            );
        });
    });


    it('persistTaskDefinition', function() {
        var definition = {
            injectableName: 'testname'
        };

        return mongo.persistTaskDefinition(definition)
        .then(function() {
            expect(waterline.taskdefinitions.findAndModifyMongo).to.have.been.calledOnce;
            expect(waterline.taskdefinitions.findAndModifyMongo).to.have.been.calledWith(
                {
                    injectableName: 'testname'
                },
                {},
                definition,
                { new: true, upsert: true }
            );
        });
    });

    it('getGraphDefinitions', function() {
        return mongo.getGraphDefinitions()
        .then(function() {
            expect(waterline.graphdefinitions.find).to.have.been.calledOnce;
            expect(waterline.graphdefinitions.find).to.have.been.calledWith({});
        });
    });

    it('getTaskDefinitions', function() {
        return mongo.getTaskDefinitions()
        .then(function() {
            expect(waterline.taskdefinitions.find).to.have.been.calledOnce;
            expect(waterline.taskdefinitions.find).to.have.been.calledWith({});
        });
    });

    it('persistGraphObject', function() {
        var _uuid = uuid.v4();
        var graph = {
            instanceId: _uuid
        };

        return mongo.persistGraphObject(graph)
        .then(function() {
            expect(waterline.graphobjects.findAndModifyMongo).to.have.been.calledOnce;
            expect(waterline.graphobjects.findAndModifyMongo).to.have.been.calledWith(
                {
                    instanceId: _uuid
                },
                {},
                graph,
                { new: true, upsert: true, fields: { _id: 0, instanceId: 1 } }
            );
        });
    });

    it('persistTaskDependencies', function() {
        var graphId = uuid.v4();
        var taskDependencyItem = {
            taskId: uuid.v4(),
            dependencies: {},
            terminalOnStates: ['failed', 'timeout', 'cancelled'],
            ignoreFailure: false
        };

        return mongo.persistTaskDependencies(taskDependencyItem, graphId)
        .then(function() {
            expect(waterline.taskdependencies.create).to.have.been.calledOnce;
            expect(waterline.taskdependencies.create).to.have.been.calledWith(
                {
                    taskId: taskDependencyItem.taskId,
                    graphId: graphId,
                    state: Constants.Task.States.Pending,
                    dependencies: {},
                    terminalOnStates: ['failed', 'timeout', 'cancelled'],
                    ignoreFailure: taskDependencyItem.ignoreFailure
                }
            );
        });
    });

    it('getTaskById', function() {
        var task1 = uuid.v4();
        var task2 = uuid.v4();

        var data = {
            taskId: task1,
            graphId: uuid.v4()
        };

        var graph = {
            instanceId: 'test',
            context: {},
            tasks: {}
        };
        graph.tasks[task1] = {};
        graph.tasks[task2] = {};
        waterline.graphobjects.findOne.resolves(graph);

        return mongo.getTaskById(data)
        .then(function(result) {
            expect(waterline.graphobjects.findOne).to.have.been.calledOnce;
            var fields = { fields: { _id: 0, instanceId: 1, context: 1, tasks: {} } };
            fields.fields.tasks[task1] = 1;
            expect(waterline.graphobjects.findOne).to.have.been.calledWith(
                { instanceId: data.graphId },
                fields
            );
            expect(result.graphId).to.equal(graph.instanceId);
            expect(result.context).to.equal(graph.context);
            expect(result.task).to.equal(graph.tasks[task1]);
        });
    });

    it('heartbeatTasksForRunner', function() {
        var leaseId = uuid.v4();

        return mongo.heartbeatTasksForRunner(leaseId)
        .then(function() {
            expect(waterline.taskdependencies.updateMongo).to.have.been.calledOnce;
            expect(waterline.taskdependencies.updateMongo).to.have.been.calledWith(
                { taskRunnerLease: leaseId, reachable: true, state: Constants.Task.States.Pending }
            );
            var update = waterline.taskdependencies.updateMongo.firstCall.args[1];
            expect(update).to.have.property('$set')
                .that.has.property('taskRunnerLease').that.equals(leaseId);
            expect(update).to.have.property('$set')
                .that.has.property('taskRunnerHeartbeat').that.is.an.instanceof(Date);
            expect(waterline.taskdependencies.updateMongo.firstCall.args[2]).to.deep.equal(
                { multi: true }
            );
        });
    });

    it('getOwnTasks', function() {
        var leaseId = uuid.v4();

        return mongo.getOwnTasks(leaseId)
        .then(function() {
            expect(waterline.taskdependencies.find).to.have.been.calledOnce;
            expect(waterline.taskdependencies.find).to.have.been.calledWith(
                {
                    where: {
                        taskRunnerLease: leaseId,
                        reachable: true,
                        state: Constants.Task.States.Pending
                    }
                }
            );
        });
    });

    it('findActiveGraphs', function() {
        return mongo.findActiveGraphs('default')
        .then(function() {
            expect(waterline.graphobjects.find).to.have.been.calledOnce;
            expect(waterline.graphobjects.find).to.have.been.calledWith(
                { domain: 'default', _status: {$in: Constants.Task.ActiveStates} }
            );
        });
    });

    it('findUnevaluatedTasks', function() {
        var tasks = _.map([{}, {}, {}], function(task) {
            task.toJSON = function() { return this; };
            return task;
        });
        var promise = Promise.resolve(tasks);
        promise.limit = sinon.stub();
        waterline.taskdependencies.find.returns(promise);

        return mongo.findUnevaluatedTasks('default', 100)
        .then(function(result) {
            expect(waterline.taskdependencies.find).to.have.been.calledOnce;
            expect(waterline.taskdependencies.find).to.have.been.calledWith(
                {
                    domain: 'default',
                    evaluated: false,
                    reachable: true,
                    state: { $in: Constants.Task.FinishedStates }
                }
            );
            expect(promise.limit).to.have.been.calledOnce;
            expect(promise.limit).to.have.been.calledWith(100);
            _.forEach(_.zip(result, tasks), function(pair) {
                expect(pair[0]).to.equal(pair[1]);
            });
        });
    });

    it('findReadyTasks with graphId', function() {
        var graphId = uuid.v4();
        var tasks = _.map([{}, {}, {}], function(task) {
            task.toJSON = function() { return this; };
            return task;
        });
        waterline.taskdependencies.find.resolves(tasks);

        return mongo.findReadyTasks('default', graphId)
        .then(function(result) {
            expect(waterline.taskdependencies.find).to.have.been.calledOnce;
            expect(waterline.taskdependencies.find).to.have.been.calledWith(
                {
                    taskRunnerLease: null,
                    domain: 'default',
                    dependencies: {},
                    reachable: true,
                    state: Constants.Task.States.Pending,
                    graphId: graphId
                }
            );
            expect(result).to.have.property('graphId').that.equals(graphId);
            expect(result).to.have.property('tasks');
            _.forEach(_.zip(result.tasks, tasks), function(pair) {
                expect(pair[0]).to.equal(pair[1]);
            });
        });
    });

    it('findReadyTasks without graphId', function() {
        var tasks = _.map([{}, {}, {}], function(task) {
            task.toJSON = function() { return this; };
            return task;
        });
        waterline.taskdependencies.find.resolves(tasks);

        return mongo.findReadyTasks('default')
        .then(function(result) {
            expect(waterline.taskdependencies.find).to.have.been.calledOnce;
            expect(waterline.taskdependencies.find).to.have.been.calledWith(
                {
                    taskRunnerLease: null,
                    domain: 'default',
                    dependencies: {},
                    reachable: true,
                    state: Constants.Task.States.Pending
                }
            );
            expect(result).to.have.property('graphId').that.equals(null);
        });
    });

    it('checkoutTask', function() {
        var taskRunnerId = uuid.v4();
        var data = {
            taskId: uuid.v4(),
            graphId: uuid.v4()
        };

        return mongo.checkoutTask(taskRunnerId, data)
        .then(function() {
            expect(waterline.taskdependencies.findAndModifyMongo).to.have.been.calledOnce;
            expect(waterline.taskdependencies.findAndModifyMongo).to.have.been.calledWith(
                {
                    graphId: data.graphId,
                    taskId: data.taskId,
                    taskRunnerLease: null,
                    dependencies: {},
                    reachable: true
                },
                {}
            );
            var update = waterline.taskdependencies.findAndModifyMongo.firstCall.args[2];
            expect(update).to.have.property('$set')
                .that.has.property('taskRunnerLease').that.equals(taskRunnerId);
            expect(update).to.have.property('$set')
                .that.has.property('taskRunnerHeartbeat').that.is.an.instanceof(Date);
            expect(update).to.have.property('$set')
                .that.has.property('taskRunnerHeartbeat').that.is.an.instanceof(Date);
            expect(waterline.taskdependencies.findAndModifyMongo.firstCall.args[3]).to.deep.equal(
                { new: true }
            );
        });
    });

    it('checkGraphSucceeded not succeeded', function() {
        var data = {
            graphId: uuid.v4()
        };
        waterline.taskdependencies.findOne.resolves(data);

        return mongo.checkGraphSucceeded(data)
        .then(function(result) {
            expect(waterline.taskdependencies.findOne).to.have.been.calledOnce;
            expect(waterline.taskdependencies.findOne).to.have.been.calledWith(
                {
                    graphId: data.graphId,
                    state: { $ne: Constants.Task.States.Succeeded },
                    ignoreFailure: { $ne: true },
                    reachable: true
                }
            );
            expect(result).to.deep.equal({
                graphId: data.graphId,
                done: false
            });
        });
    });

    it('checkGraphSucceeded succeeded', function() {
        var data = {
            graphId: uuid.v4()
        };
        waterline.taskdependencies.findOne.resolves(null);
        return expect(mongo.checkGraphSucceeded(data)).to.become({
            graphId: data.graphId,
            done: true
        });
    });

    it('updateDependentTasks', function() {
        var data = {
            state: 'succeeded',
            taskId: uuid.v4(),
            graphId: uuid.v4()
        };

        return mongo.updateDependentTasks(data)
        .then(function() {
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
            expect(waterline.taskdependencies.updateMongo).to.have.been.calledOnce;
            expect(waterline.taskdependencies.updateMongo).to.have.been.calledWith(
                query, update, { multi: true }
            );
        });
    });

    it('updateUnreachableTasks', function() {
        var data = {
            state: 'succeeded',
            taskId: uuid.v4(),
            graphId: uuid.v4()
        };

        var query = {
            graphId: data.graphId,
            reachable: true
        };
        query['dependencies.' + data.taskId] = {
            $in: _.difference(Constants.Task.FinishedStates, [data.state])
        };

        return mongo.updateUnreachableTasks(data)
        .then(function() {
            expect(waterline.taskdependencies.updateMongo).to.have.been.calledOnce;
            expect(waterline.taskdependencies.updateMongo).to.have.been.calledWith(
                query,
                { $set: { reachable: false } },
                { multi: true }
            );
        });
    });

    it('markTaskEvaluated', function() {
        var data = {
            state: 'succeeded',
            taskId: uuid.v4(),
            graphId: uuid.v4()
        };

        return mongo.markTaskEvaluated(data)
        .then(function() {
            expect(waterline.taskdependencies.findAndModifyMongo).to.have.been.calledOnce;
            expect(waterline.taskdependencies.findAndModifyMongo).to.have.been.calledWith(
                {
                    graphId: data.graphId,
                    taskId: data.taskId,
                    reachable: true
                },
                {},
                { $set: { evaluated: true } },
                { new: true }
            );
        });
    });

    it('findExpiredLeases', function() {
        var leaseAdjust = 5000;
        var date = Date.now();

        return mongo.findExpiredLeases('default', leaseAdjust)
        .then(function() {
            expect(waterline.taskdependencies.find).to.have.been.calledOnce;
            var query = waterline.taskdependencies.find.firstCall.args[0];
            expect(query).to.have.property('domain').that.equals('default');
            expect(query).to.have.property('reachable').that.equals(true);
            expect(query).to.have.property('taskRunnerLease').that.deep.equals({ $ne: null });
            expect(query).to.have.property('state').that.equals(Constants.Task.States.Pending);
            expect(query.taskRunnerHeartbeat).to.have.property('$lt').that.is.an.instanceof(Date);
            // Just make sure we did some subtraction with leaseAdjust. Getting the
            // hard value here/stubbing Date.now isn't really worth the effort.
            expect(query.taskRunnerHeartbeat.$lt < new Date(date - 4000)).to.equal(true);
        });
    });

    it('expireLease', function() {
        waterline.taskdependencies.mongo.objectId.withArgs('testobjectid')
            .returns({ fakeId: 'testobjectid' });

        return mongo.expireLease('testobjectid')
        .then(function() {
            expect(waterline.taskdependencies.findAndModifyMongo).to.have.been.calledOnce;
            expect(waterline.taskdependencies.findAndModifyMongo).to.have.been.calledWith(
                { _id: { fakeId: 'testobjectid' } },
                {},
                { $set: { taskRunnerLease: null, taskRunnerHeartbeat: null } },
                { new: false }
            );
        });
    });

    it('findCompletedTasks', function() {
        var limit = 100;
        return mongo.findCompletedTasks(limit)
        .then(function() {
            expect(waterline.taskdependencies.findMongo).to.have.been.calledOnce;
            expect(waterline.taskdependencies.findMongo).to.have.been.calledWith(
                {
                    $or: [
                        {
                            evaluated: true,
                            state: {
                                $in: Constants.Task.FinishedStates
                            }
                        },
                        { reachable: false }
                    ]
                },
                { limit: 100 }
            );
        });
    });

    it('deleteTasks', function() {
        var objectIds = ['testobjectid1', 'testobjectid2', 'testobjectid3'];

        waterline.taskdependencies.mongo.objectId.withArgs('testobjectid1')
            .returns({ fakeId: 'testobjectid1' });
        waterline.taskdependencies.mongo.objectId.withArgs('testobjectid2')
            .returns({ fakeId: 'testobjectid2' });
        waterline.taskdependencies.mongo.objectId.withArgs('testobjectid3')
            .returns({ fakeId: 'testobjectid3' });

        return mongo.deleteTasks(objectIds)
        .then(function() {
            var expected = [
                { fakeId: 'testobjectid1' },
                { fakeId: 'testobjectid2' },
                { fakeId: 'testobjectid3' }
            ];
            expect(waterline.taskdependencies.removeMongo).to.have.been.calledOnce;
            expect(waterline.taskdependencies.removeMongo).to.have.been.calledWith(
                { _id: { $in: expected } }
            );
        });
    });

    it('deleteTaskByName', function() {
        var task = { injectableName: 'testname' };
        task.toJSON = function() { return this; };
        waterline.taskdefinitions.destroy.resolves(task);
        return mongo.deleteTaskByName('testname')
        .then(function() {
            expect(waterline.taskdefinitions.destroy).to.have.been.calledOnce;
            expect(waterline.taskdefinitions.destroy).to.have.been.calledWith(
                { injectableName: 'testname' }
            );
        });
    });

    it('destroyGraphDefinition', function() {
        var graph = { injectableName: 'testname'  };
        waterline.graphdefinitions.destroy.resolves(graph);
        return mongo.destroyGraphDefinition('testname')
        .then(function() {
            expect(waterline.graphdefinitions.destroy).to.have.been.calledOnce;
            expect(waterline.graphdefinitions.destroy).to.have.been.calledWith(
                {injectableName: 'testname'}
            );
        });
    });

    it('setIndexes', function() {
        var indexObject = {
            taskdependencies: [
                {taskId: 1, graphId: 1}
            ]
        };

        return mongo.setIndexes(indexObject)
        .then(function() {
            expect(waterline.taskdependencies.createMongoIndexes).to.be
                .calledWithExactly({taskId: 1, graphId: 1});
        });
    });

    it('findChildGraph', function() {
        var runGraphTaskId = uuid.v4();
        return mongo.findChildGraph(runGraphTaskId)
        .then(function() {
            expect(waterline.graphobjects.findOneMongo).to.be
                .calledWithExactly({"parentTaskId": runGraphTaskId});
        });
    });

    it('publishRecordByGraphId', function() {
        var testObj = {};

        waterline.graphobjects.needOneMongo.resolves(testObj);
        waterline.graphobjects.publishRecord.resolves();

        return mongo.publishRecordByGraphId('testid', 'testevent')
        .then(function() {
            expect(waterline.graphobjects.needOneMongo).to.have.been.calledWith(
                { instanceId: 'testid' }
            );
            expect(waterline.graphobjects.publishRecord).to.have.been.calledWith(
                'testevent', testObj, 'testid');
        });
    });

    it("updateGraphProgress", function(){
        var data = {
            graphId: uuid.v4(),
            graphName: "anything",
            progress: {
                description: "Unit test info",
                percentage: "10%"
            }
        };
        waterline.graphobjects.find.resolves();
        return mongo.updateGraphProgress(data)
        .then(function(_data){
            expect(_data).to.deep.equals(data);
            expect(waterline.graphobjects.updateMongo).to.be.calledOnce;
            expect(waterline.graphobjects.updateMongo).to.be.calledWith(
                {
                    instanceId: data.graphId,
                    _status: {$in: Constants.Task.ActiveStates}
                },
                {
                    $set: {progress: data.progress}
                },
                {
                    multi: true
                }
            );
        });
    });

    it("updateGraphProgress description only", function(){
        var data = {
            graphId: uuid.v4(),
            progress: {
                description: "Unit test info",
                percentage: "na"
            }},
            graphObjects = [{
                progress: {
                    description: "Unit test info",
                    percentage: "0%"
                },
                definition: {friendlyName: "Friendly name"}
            }];
        waterline.graphobjects.find.resolves(graphObjects);
        return mongo.updateGraphProgress(data)
        .then(function(_data){
            data.progress.percentage = graphObjects[0].progress.percentage;
            data.graphName = graphObjects[0].definition.friendlyName;
            expect(_data).to.deep.equals(data);
            expect(waterline.graphobjects.find).to.be.calledWith({instanceId: data.graphId});
            expect(waterline.graphobjects.updateMongo).to.be.calledOnce;
            expect(waterline.graphobjects.updateMongo).to.be.calledWith(
                {
                    instanceId: data.graphId,
                    _status: {$in: Constants.Task.ActiveStates}
                },
                {
                    $set: {progress: data.progress}
                },
                {
                    multi: true
                }
            );
        });
    });

    it("updateTaskProgress", function(){
        var data = {
            graphId: uuid.v4(),
            taskId: uuid.v4(),
            progress: {
                description: "Unit test info",
                percentage: "10%"
            }
        };
        waterline.taskdependencies.updateMongo.resolves();
        return mongo.updateTaskProgress(data)
        .then(function(){
            expect(waterline.taskdependencies.updateMongo).to.be.calledOnce;
            expect(waterline.taskdependencies.updateMongo).to.be.calledWith(
                {
                    graphId: data.graphId,
                    taskId: data.taskId,
                    reachable: true
                },
                {
                    $set: {progress: data.progress}
                },
                {
                    multi: true
                }
            );
        });
    });
});

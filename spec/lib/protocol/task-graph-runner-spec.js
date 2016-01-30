// Copyright 2015, EMC, Inc.


'use strict';

describe("TaskGraph Runner protocol functions", function () {
    var testSubscription,
        testMessage,
        messenger,
        taskgraphrunner,
        sampleError = new Error('someError');

    helper.before();

    before(function () {
        taskgraphrunner = helper.injector.get('Protocol.TaskGraphRunner');
        messenger = helper.injector.get('Services.Messenger');
        var Message = helper.injector.get('Message');
        var Subscription = helper.injector.get('Subscription');
        
        testSubscription = new Subscription({},{});
        testMessage = new Message({},{},{});
        sinon.stub(testMessage);
        sinon.stub(messenger);
    });

    helper.after();

    describe("getTaskGraphLibrary", function() {
        it("should subscribe and receive getTaskGraphLibrary results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({filter:testFilter},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});   
            return taskgraphrunner.subscribeGetTaskGraphLibrary(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getTaskGraphLibrary(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive getTaskGraphLibrary results without a filter", function() {
            var self = this,
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({filter:{}},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeGetTaskGraphLibrary(function(filter) {
                expect(filter).to.be.undefined;
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getTaskGraphLibrary();
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive getTaskGraphLibrary failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError); 
            return taskgraphrunner.subscribeGetTaskGraphLibrary(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getTaskGraphLibrary(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("getTaskLibrary", function() {
        it("should subscribe and receive getTaskLibrary results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({filter:testFilter},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeGetTaskLibrary(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getTaskLibrary(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive getTaskLibrary results without a filter", function() {
            var self = this,
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({filter:{}},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeGetTaskLibrary(function(filter) {
                expect(filter).to.be.undefined;
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getTaskLibrary();
            }).then(function(data) {
                expect(data).to.deep.equal(testData);

            });
        });

        it("should subscribe and receive getTaskLibrary failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError); 
            return taskgraphrunner.subscribeGetTaskLibrary(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getTaskLibrary(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("getActiveTaskGraph", function() {
        it("should subscribe and receive getActiveTaskGraph results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({filter:testFilter},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeGetActiveTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getActiveTaskGraph(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive getActiveTaskGraph results without a filter", function() {
            var self = this,
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({filter:{}},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeGetActiveTaskGraph(function(filter) {
                expect(filter).to.be.undefined;
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getActiveTaskGraph();
            }).then(function(data) {
                expect(data).to.deep.equal(testData);

            });
        });

        it("should subscribe and receive getActiveTaskGraph failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError); 
            return taskgraphrunner.subscribeGetActiveTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getActiveTaskGraph(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("getActiveTaskGraphs", function() {
        it("should subscribe and receive getActiveTaskGraphs results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({filter:testFilter},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeGetActiveTaskGraphs(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getActiveTaskGraphs(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive getActiveTaskGraphs results without a filter", function() {
            var self = this,
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({filter:{}},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeGetActiveTaskGraphs(function(filter) {
                expect(filter).to.be.undefined;
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getActiveTaskGraphs();
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive getActiveTaskGraphs failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError); 
            return taskgraphrunner.subscribeGetActiveTaskGraphs(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.getActiveTaskGraphs(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("defineTaskGraph", function() {
        it("should subscribe and receive defineTaskGraph results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({definition:{}},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeDefineTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.defineTaskGraph(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive defineTaskGraph results without a filter", function() {
            var self = this,
                testData = { abc: '123' },
                testDef = { definition: 'abc' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testDef},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeDefineTaskGraph(function(filter) {
                expect(filter).to.be.undefined;
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.defineTaskGraph(testDef);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive defineTaskGraph failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError); 
            return taskgraphrunner.subscribeDefineTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                testSubscription = subscription;

                return taskgraphrunner.defineTaskGraph(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("defineTask", function() {
        it("should subscribe and receive defineTask results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({definition:{}},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeDefineTask(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.defineTask(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive defineTask results without a filter", function() {
            var self = this,
                testData = { abc: '123' },
                testDef = { definition: 'abc' };
            messenger.request.resolves({value:testData});
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testDef},testMessage);
                return Promise.resolve(testSubscription);
            });
            return taskgraphrunner.subscribeDefineTask(function(filter) {
                expect(filter).to.be.undefined;
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.defineTask(testDef);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive defineTask failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError); 
            return taskgraphrunner.subscribeDefineTask(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.defineTask(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("runTaskGraph", function() {
        it("should subscribe and receive runTaskGraph results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({filter:testFilter},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeRunTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.runTaskGraph(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive runTaskGraph results without a filter", function() {
            var self = this,
                testData = { abc: '123' },
                testOpts = { 
                    name: 'abc',
                    options: {},
                    target: '' 
                };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback({value:testOpts},testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeRunTaskGraph(function(filter) {
                expect(filter).to.be.undefined;
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.runTaskGraph(testOpts);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive runTaskGraph failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError); 
            return taskgraphrunner.subscribeRunTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.runTaskGraph(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("cancelTaskGraph", function() {
        it("should subscribe and receive cancelTaskGraph results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(testFilter,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeCancelTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.cancelTaskGraph(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive cancelTaskGraph failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError); 
            return taskgraphrunner.subscribeCancelTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.cancelTaskGraph(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("pauseTaskGraph", function() {
        it("should subscribe and receive pauseTaskGraph results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(testFilter,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribePauseTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.pauseTaskGraph(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive pauseTaskGraph failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError); 
            return taskgraphrunner.subscribePauseTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.pauseTaskGraph(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });

    describe("resumeTaskGraph", function() {
        it("should subscribe and receive resumeTaskGraph results", function() {
            var self = this,
                testFilter = { foo: 'bar'},
                testData = { abc: '123' };
            messenger.subscribe = sinon.spy(function(a,b,callback) {
                callback(testFilter,testMessage);
                return Promise.resolve(testSubscription);
            });
            messenger.request.resolves({value:testData});
            return taskgraphrunner.subscribeResumeTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                return testData;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.resumeTaskGraph(testFilter);
            }).then(function(data) {
                expect(data).to.deep.equal(testData);
            });
        });

        it("should subscribe and receive resumeTaskGraph failures", function() {
            var self = this,
                testFilter = { foo: 'bar'};
            messenger.request.rejects(sampleError);
            return taskgraphrunner.subscribeResumeTaskGraph(function(filter) {
                expect(filter).to.deep.equal(testFilter);
                throw sampleError;
            }).then(function(subscription) {
                expect(subscription).to.be.ok;
                return taskgraphrunner.resumeTaskGraph(testFilter);
            }).should.be.rejectedWith(sampleError);
        });
    });
});

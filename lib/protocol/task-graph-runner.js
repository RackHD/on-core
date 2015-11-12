// Copyright 2015, EMC, Inc.

'use strict';

module.exports = taskGraphRunnerProtocolFactory;

taskGraphRunnerProtocolFactory.$provide = 'Protocol.TaskGraphRunner';
taskGraphRunnerProtocolFactory.$inject = [
    'Promise',
    'Services.Messenger',
    'Constants',
    'Assert',
    '_',
    'Result'
];

function taskGraphRunnerProtocolFactory (
    Promise,
    messenger,
    Constants,
    assert,
    _,
    Result
) {
    function TaskGraphRunnerProtocol() {
    }

    TaskGraphRunnerProtocol.prototype.getTaskGraphLibrary = function (filter) {
        if (filter) {
            assert.object(filter);
        }

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getTaskGraphLibrary',
            { filter: filter }
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskGraphLibrary = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getTaskGraphLibrary',
            function(data, message) {
                Promise.resolve().then(function() {
                    return callback(data.filter);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };



    TaskGraphRunnerProtocol.prototype.getTaskLibrary = function (filter) {
        if (filter) {
            assert.object(filter);
        }

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getTaskLibrary',
            { filter: filter }
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskLibrary = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getTaskLibrary',
            function(data, message) {
                Promise.resolve().then(function() {
                    return callback(data.filter);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };


    TaskGraphRunnerProtocol.prototype.getActiveTaskGraph = function (filter) {
        if (filter) {
            assert.object(filter);
        }

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getActiveTaskGraph',
            { filter: filter }
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetActiveTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getActiveTaskGraph',
            function (data, message) {
                Promise.resolve().then(function() {
                    return callback(data.filter);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.getActiveTaskGraphs = function (filter) {
        if (filter) {
            assert.object(filter);
        }

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getActiveTaskGraphs',
            { filter: filter }
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetActiveTaskGraphs = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.getActiveTaskGraphs',
            function (data, message) {
                Promise.resolve().then(function() {
                    return callback(data.filter);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.defineTaskGraph = function (definition) {
        // TODO: BBP what asserts to we need here?

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.defineTaskGraph',
            { definition: definition }
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribeDefineTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.defineTaskGraph',
            function(data, message) {
                Promise.resolve().then(function() {
                    return callback(data.definition);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.defineTask = function (definition) {
        // TODO: BBP what asserts to we need here?

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.defineTask',
            { definition: definition }
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribeDefineTask = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.defineTask',
            function (data, message) {
                Promise.resolve().then(function() {
                    return callback(data.definition);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.runTaskGraph = function (domain, name, options, target) {
        domain = domain || Constants.DefaultTaskDomain;
        return messenger.publish(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.runTaskGraph' + '.' + domain,
            { name: name, options: options, target: target }
        );
    };

    TaskGraphRunnerProtocol.prototype.subscribeRunTaskGraph = function (domain, callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.runTaskGraph' + '.' + domain,
            callback
        );
    };

    TaskGraphRunnerProtocol.prototype.cancelTaskGraph = function (filter) {
        // NOTE(heckj): mandatory filter since we're passing it into messenger.request
        // without boxing it in another object
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.cancelTaskGraph',
            filter
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribeCancelTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.cancelTaskGraph',
            function (data, message) {
                Promise.resolve().then(function() {
                    return callback(data);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };


    TaskGraphRunnerProtocol.prototype.pauseTaskGraph = function (filter) {
        // NOTE(heckj): mandatory filter since we're passing it into messenger.request
        // without boxing it in another object
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.pauseTaskGraph',
            filter
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribePauseTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.pauseTaskGraph',
            function (data, message) {
                Promise.resolve().then(function() {
                    return callback(data);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };

    TaskGraphRunnerProtocol.prototype.resumeTaskGraph = function (filter) {
        // NOTE(heckj): mandatory filter since we're passing it into messenger.request
        // without boxing it in another object
        assert.object(filter);

        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.resumeTaskGraph',
            filter
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribeResumeTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.resumeTaskGraph',
            function (data, message) {
                Promise.resolve().then(function() {
                    return callback(data);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };

    // VERIFY NOT USED - PENDING DELETE
    //
    //TaskGraphRunnerProtocol.prototype.subscribeRequestTasks = function (callback) {
    //    assert.func(callback);
    //
    //    return messenger.subscribe(
    //        Constants.Protocol.TaskGraphRunner.Exchange.Name,
    //        'methods.subscribeRequestTasks',
    //        function (data, message) {
    //            Promise.resolve().then(function() {
    //                return callback(data.instance);
    //            }).then(function (result) {
    //                return message.resolve(
    //                    new Result({ value: result })
    //                );
    //            }).catch(function (error) {
    //                return message.reject(error);
    //            });
    //        }
    //    );
    //};
    //
    //TaskGraphRunnerProtocol.prototype.subscribePublishTasks = function (callback) {
    //    assert.func(callback);
    //
    //    return messenger.subscribe(
    //        Constants.Protocol.TaskGraphRunner.Exchange.Name,
    //        'methods.subscribePublishTasks',
    //        function (data, message) {
    //            Promise.resolve().then(function() {
    //                return callback(data.instance);
    //            }).then(function (result) {
    //                return message.resolve(
    //                    new Result({ value: result })
    //                );
    //            }).catch(function (error) {
    //                return message.reject(error);
    //            });
    //        }
    //    );
    //};

    return new TaskGraphRunnerProtocol();
}

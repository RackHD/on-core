// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskGraphRunnerProtocolFactory;

di.annotate(taskGraphRunnerProtocolFactory, new di.Provide('Protocol.TaskGraphRunner'));
di.annotate(taskGraphRunnerProtocolFactory,
    new di.Inject(
        'Q',
        'Services.Messenger',
        'Constants',
        'Assert',
        '_',
        'Result'
    )
);

function taskGraphRunnerProtocolFactory (
    Q,
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
                Q.resolve().then(function() {
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
                Q.resolve().then(function() {
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
                Q.resolve().then(function() {
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
                Q.resolve().then(function() {
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
                Q.resolve().then(function() {
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
                Q.resolve().then(function() {
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

    TaskGraphRunnerProtocol.prototype.runTaskGraph = function (name, options, target) {
        // TODO: BBP what asserts to we need here?
        return messenger.request(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.runTaskGraph',
            { name: name, options: options, target: target }
        ).then(function (data) {
            return data.value;
        });
    };

    TaskGraphRunnerProtocol.prototype.subscribeRunTaskGraph = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.TaskGraphRunner.Name,
            'methods.runTaskGraph',
            function (data, message) {
                Q.resolve().then(function() {
                    return callback(data.name, data.options, data.target);
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

    TaskGraphRunnerProtocol.prototype.cancelTaskGraph = function (filter) {
        if (filter) {
            assert.object(filter);
        }

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
                Q.resolve().then(function() {
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
        if (filter) {
            assert.object(filter);
        }

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
                Q.resolve().then(function() {
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
        if (filter) {
            assert.object(filter);
        }

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
                Q.resolve().then(function() {
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
    
    TaskGraphRunnerProtocol.prototype.subscribeRequestTasks = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.TaskGraphRunner.Exchange.Name,
            'methods.subscribeRequestTasks',
            function (data, message) {
                Q.resolve().then(function() {
                    return callback(data.instance);
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

    TaskGraphRunnerProtocol.prototype.subscribePublishTasks = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.TaskGraphRunner.Exchange.Name,
            'methods.subscribePublishTasks',
            function (data, message) {
                Q.resolve().then(function() {
                    return callback(data.instance);
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

    return new TaskGraphRunnerProtocol();
}

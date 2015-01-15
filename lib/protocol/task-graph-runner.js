// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = taskGraphRunnerProtocolFactory;

di.annotate(taskGraphRunnerProtocolFactory, new di.Provide('Protocol.TaskGraphRunner'));
di.annotate(taskGraphRunnerProtocolFactory,
    new di.Inject(
        'Services.Messenger'
    )
);

function taskGraphRunnerProtocolFactory (messenger) {
    function TaskGraphRunnerProtocol() {
        messenger;
    }

    TaskGraphRunnerProtocol.prototype.getActiveTaskGraphs = function getActiveTaskGraphs() {
    };

    TaskGraphRunnerProtocol.prototype.runTaskGraph = function runTaskGraph() {
    };

    TaskGraphRunnerProtocol.prototype.cancelTaskGraph = function cancelTaskGraph() {
    };

    TaskGraphRunnerProtocol.prototype.pauseTaskGraph = function pauseTaskGraph() {
    };

    TaskGraphRunnerProtocol.prototype.getActiveTaskGraphState =
                        function getActiveTaskGraphState(instance) {
        instance;
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskGraph =
                        function subscribeGetTaskGraph(tgName) {
        tgName;
    };

    TaskGraphRunnerProtocol.prototype.subscribeDefineTaskGraph =
                                        function subscribeDefineTaskGraph() {
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetActiveTaskGraphs =
                                        function subscribeGetActiveTaskGraphs() {
    };

    TaskGraphRunnerProtocol.prototype.subscribeRunTaskGraph = function subscribeRunTaskGraph() {
    };

    TaskGraphRunnerProtocol.prototype.subscribeCancelTaskGraph =
                                        function subscribeCancelTaskGraph() {
    };

    TaskGraphRunnerProtocol.prototype.subscribePauseTaskGraph = function subscribePauseTaskGraph() {
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetActiveTaskGraphState =
                                        function subscribeGetActiveTaskGraphState(instance) {
        instance;
    };

    TaskGraphRunnerProtocol.prototype.subscribeGetTaskGraph =
                                        function subscribeGetTaskGraph(tgName) {
        tgName;
    };

    TaskGraphRunnerProtocol.prototype.subscribeDefineTaskGraph =
                                        function subscribeDefineTaskGraph() {
    };

    return new TaskGraphRunnerProtocol();
}

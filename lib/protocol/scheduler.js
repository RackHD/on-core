// Copyright 2015, EMC, Inc.

'use strict';

module.exports = schedulerProtocolFactory;

schedulerProtocolFactory.$provide = 'Protocol.Scheduler';
schedulerProtocolFactory.$inject = [
    'Services.Messenger',
    'Constants',
    'Assert'
];

function schedulerProtocolFactory (messenger, Constants, assert) {
    function SchedulerProtocol() {
    }

    SchedulerProtocol.prototype.schedule = function(taskId, taskName, overrides) {
        assert.uuid(taskId);

        return messenger.publishInternalEvents(
            Constants.Protocol.Exchanges.Scheduler.Name,
            'schedule',
            { taskId: taskId, taskName: taskName, overrides: overrides }
        );
    };

    SchedulerProtocol.prototype.subscribeSchedule = function(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Scheduler.Name,
            'schedule',
            function(data) {
                callback(data.taskId, data.taskName, data.overrides);
            }
        );
    };

    return new SchedulerProtocol();
}

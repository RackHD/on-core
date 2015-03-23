// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = schedulerProtocolFactory;

di.annotate(schedulerProtocolFactory, new di.Provide('Protocol.Scheduler'));
di.annotate(schedulerProtocolFactory,
    new di.Inject(
        'Services.Messenger',
        'Constants',
        'Assert'
    )
);

function schedulerProtocolFactory (messenger, Constants, assert) {
    function SchedulerProtocol() {
    }

    SchedulerProtocol.prototype.schedule = function(taskId, taskName, overrides) {
        assert.uuid(taskId);

        return messenger.publish(
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

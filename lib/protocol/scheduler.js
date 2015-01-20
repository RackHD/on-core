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

    SchedulerProtocol.prototype.schedule = function(taskId, taskName) {
        assert.uuid(taskId);

        messenger.publish(
            Constants.Protocol.Exchanges.Scheduler.Name,
            'schedule',
            { taskId: taskId, taskName: taskName }
        );
    };

    SchedulerProtocol.prototype.subscribeSchedule = function(callback) {
        assert.func(callback);
        return messenger.subscribe(
                Constants.Protocol.Exchanges.Scheduler.Name,
                'schedule',
                function(message) {
                    assert.object(message.data, 'Scheduler.schedule message data');
                    assert.uuid(message.data.taskId, 'Scheduler.schedule taskId');
                    var _callback = callback;
                    _callback(message.data.taskId, message.data.taskName);
                }
        );
    };

    return new SchedulerProtocol();
}

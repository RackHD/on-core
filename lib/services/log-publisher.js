// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = logPublisherFactory;

logPublisherFactory.$provide = 'Services.LogPublisher';
logPublisherFactory.$inject = [
    'Constants',
    'Events',
    'LogEvent',
    'Messenger',
    'EventEmitter',
    'Util'
];

function logPublisherFactory(Constants, events, LogEvent, Messenger, EventEmitter, util) {
    function LogPublisher() {
        EventEmitter.call(this);

        // Service Start Priority
        this.startupPriority = 1;

        // Embedded Messenger strictly for log publishing.
        this.messenger = new Messenger();

        this.callback = this.handleLogEvent.bind(this);
    }

    util.inherits(LogPublisher, EventEmitter);

    LogPublisher.prototype.start = function() {
        var self = this;

        return this.messenger.start().then(function () {
            events.on(Constants.Events.Log, self.callback);
        });
    };

    LogPublisher.prototype.handleLogEvent = function(options) {
        var self = this;

        return LogEvent.create(options).then(function (e) {
            return e.print();
        }).then(function (e) {
            return self.messenger.publish(
                Constants.Protocol.Exchanges.Logging.Name,
                e.level,
                e
            );
        }).catch(function (error) {
            events.ignoreError(error);
        });
    };

    LogPublisher.prototype.stop = function() {
        var self = this;

        return this.messenger.stop().then(function () {
            events.off(Constants.Events.Log, self.callback);
        });
    };

    return new LogPublisher();
}


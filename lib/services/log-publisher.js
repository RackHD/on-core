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
            events.on('log', self.callback);
        });
    };

    LogPublisher.prototype.handleLogEvent = function(options) {
        var self = this;

        LogEvent.create(options).then(function (e) {
            return e.print();
        }).then(function (e) {
            return self.messenger.publish(
                Constants.Protocol.Exchanges.Logging.Name,
                e.level,
                e
            );
        }).catch(function (error) {
            self.emit('error', error);
        });
    };

    LogPublisher.prototype.stop = function() {
        var self = this;

        return this.messenger.stop().then(function () {
            events.off('log', self.callback);
        });
    };

    return new LogPublisher();
}


// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = logPublisherFactory;

di.annotate(logPublisherFactory, new di.Provide('Services.LogPublisher'));
di.annotate(logPublisherFactory,
    new di.Inject(
        'Constants',
        'Events',
        'LogEvent',
        'Messenger'
    )
);

function logPublisherFactory(Constants, events, LogEvent, Messenger) {
    function LogPublisher() {
        // Service Start Priority
        this.startupPriority = 1;

        // Embedded Messenger strictly for log publishing.
        this.messenger = new Messenger();

        this.callback = this.handleLogEvent.bind(this);
    }

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
            console.log(error.message);
            console.log(error.stack);
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


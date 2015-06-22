// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = ErrorPublisherFactory;

ErrorPublisherFactory.$provide = 'Services.ErrorPublisher';
ErrorPublisherFactory.$inject = [
    'Constants',
    'Promise',
    'Events',
    'Protocol.Events',
    'Logger',
    'blocked',
    'Services.StatsD'
];

function ErrorPublisherFactory(
    Constants,
    Promise,
    events,
    eventsProtocol,
    Logger,
    blocked,
    statsd
) {
    var logger = Logger.initialize(ErrorPublisherFactory);

    function severity(ms) {
        if (ms < 100) {
            return 'notice';
        }

        if (ms < 500) {
            return 'error';
        }

        return 'alert';
    }

    function ErrorPublisher() {
        this.started = false;

        // These are emitted by the 'Events' EventEmitter.
        this.ignoredError = this.handleIgnoredError.bind(this);

        // Attached here instead of in start because it cannot be
        // unattached in stop which results in a subscription per
        // call to start.
        process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));

        blocked(this.handleBlockedEventLoop.bind(this));
    }

    ErrorPublisher.prototype.start = function() {
        var self = this;

        events.on(Constants.Events.Ignored, this.ignoredError);

        return Promise.resolve().then(function () {
            self.started = true;
        });
    };

    ErrorPublisher.prototype.handleUnhandledRejection = function(error) {
        if (this.started) {
            eventsProtocol.publishUnhandledError(error);
        }

        logger.debug('Unhandled Rejection', { error: error });
    };

    ErrorPublisher.prototype.handleIgnoredError = function (error) {
        if (this.started) {
            eventsProtocol.publishIgnoredError(error);
        }

        logger.debug('Ignored Error', { error: error });
    };

    ErrorPublisher.prototype.handleBlockedEventLoop = function (ms) {
        var e = {
            host: Constants.Host,
            name: Constants.Name,
            severity: severity(ms),
            ms: ms
        };

        if (this.started) {
            eventsProtocol.publishBlockedEventLoop(e);

            statsd.timing('process.blocked', ms);
        }

        logger[e.severity]('Event Loop Blocked', e);
    };

    ErrorPublisher.prototype.stop = function() {
        var self = this;

        events.off(Constants.Events.Ignored, this.ignoredError);

        return Promise.resolve().then(function () {
            self.started = false;
        });
    };

    return new ErrorPublisher();
}


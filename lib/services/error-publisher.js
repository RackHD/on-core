// Copyright 2015, EMC, Inc.

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
        if (ms < 50) {
            return 'debug';
        }

        if (ms < 500) {
            return 'error';
        }

        return 'critical';
    }

    function ErrorPublisher() {
        this.started = false;

        // These are emitted by the 'Events' EventEmitter.
        this.ignoredError = this.handleIgnoredError.bind(this);


        blocked(this.handleBlockedEventLoop.bind(this));
    }

    ErrorPublisher.prototype.start = function() {
        var self = this;

        events.on(Constants.Events.Ignored, this.ignoredError);

        process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));

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

        process.removeAllListeners('unhandledRejection');

        return Promise.resolve().then(function () {
            self.started = false;
        });
    };

    return new ErrorPublisher();
}

// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ErrorPublisherFactory;

ErrorPublisherFactory.$provide = 'Services.ErrorPublisher';
ErrorPublisherFactory.$inject = [
    'Constants',
    'Promise',
    'Events',
    'Protocol.Events',
    'Logger'
];

function ErrorPublisherFactory(
    Constants,
    Promise,
    events,
    eventsProtocol,
    Logger
) {
    var logger = Logger.initialize(ErrorPublisherFactory);

    function ErrorPublisher() {
        this.started = false;

        // These are emitted by the 'Events' EventEmitter.
        this.ignoredError = this.handleIgnoredError.bind(this);
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

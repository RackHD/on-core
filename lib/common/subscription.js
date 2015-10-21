// Copyright 2015, EMC, Inc.

'use strict';

module.exports = SubscriptionFactory;

SubscriptionFactory.$provide = 'Subscription';
SubscriptionFactory.$inject = [
    'Promise',
    'Logger',
    'Assert'
];

function SubscriptionFactory (Promise, Logger, assert) {
    var logger = Logger.initialize(SubscriptionFactory);

    /**
     * Creates a new subscription to a queue
     * @param queue {string}
     * @constructor
     */
    function Subscription (queue, options) {
        assert.object(queue, 'queue');
        assert.object(options, 'options');

        this.MAX_DISPOSE_RETRIES = 3;
        this.retryDelay = 1000;
        this.queue = queue;
        this.options = options;
        this._disposed = false;
    }

    /**
     * Removes the subscription
     *
     * @returns {Promise}
     */
    Subscription.prototype.dispose = function (attempt, retry) {
        var self = this;
        if (self._disposed && !retry) {
            logger.warning('Subscription dispose was called more than once.', {
                stack: new Error().stack,
                consumerTag: self.options.consumerTag
            });
            return Promise.resolve(true);
        } else {
            self._disposed = true;
        }

        if (attempt === undefined) {
            attempt = 0;
        } else if (attempt >= self.MAX_DISPOSE_RETRIES) {
            logger.error('Subscription failed to dispose with maximum retries.', {
                consumerTag: self.options.consumerTag
            });
            return Promise.reject(new Error('Subscription ' + self.options.consumerTag +
                        ' failed to dispose with maximum retries'));
        }

        attempt += 1;

        if (this.queue.state === 'open') {
            return Promise.resolve().then(function () {
                return self.queue.unsubscribe(self.options.consumerTag);
            }).then(function () {
                return self.queue.destroy();
            }).then(function () {
                return self.queue.close();
            }).then(function () {
                return true;
            }).catch(function(err) {
                logger.error('Subscription failed to dispose, retrying attempt ' + attempt, {
                    error: err
                });
                Promise.delay(self.retryDelay).then(function() {
                    self.dispose(attempt, true);
                });
                throw err;
            });
        } else {
            return Promise.reject(
                    new Error('Attempted to dispose a subscription whose queue state is not open'));
        }
    };

    return Subscription;
}

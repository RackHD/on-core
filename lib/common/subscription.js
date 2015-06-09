// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = SubscriptionFactory;

SubscriptionFactory.$provide = 'Subscription';
SubscriptionFactory.$inject = [
    'Promise',
    'Assert'
];

function SubscriptionFactory (Promise, assert) {

    /**
     * Creates a new subscription to a queue
     * @param queue {string}
     * @constructor
     */
    function Subscription (queue, options) {
        assert.object(queue, 'queue');
        assert.object(options, 'options');

        this.queue = queue;
        this.options = options;
    }

    /**
     * Removes the subscription
     *
     * @returns {Promise}
     */
    Subscription.prototype.dispose = function () {
        var self = this;

        if (this.queue.state === 'open') {
            return Promise.resolve().then(function () {
                return self.queue.unsubscribe(self.options.consumerTag);
            }).then(function () {
                return self.queue.destroy();
            }).then(function () {
                return self.queue.close();
            }).then(function () {
                return true;
            });
        } else {
            return Promise.reject(new Error('Subscription Already Disposed.'));
        }
    };

    return Subscription;
}

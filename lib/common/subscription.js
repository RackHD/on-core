// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = SubscriptionFactory;

di.annotate(SubscriptionFactory, new di.Provide('Subscription'));
di.annotate(SubscriptionFactory,
    new di.Inject(
        'Q',
        'Assert'
    )
);

function SubscriptionFactory (Q, assert) {

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
     * @returns {Q.promise}
     */
    Subscription.prototype.dispose = function () {
        var self = this;

        return Q.resolve().then(function () {
            return self.queue.unsubscribe(self.options.consumerTag)
        }).then(function () {
            return self.queue.destroy();
        }).then(function () {
            return self.queue.close();
        }).then(function () {
            return true;
        });
    };

    return Subscription;
}

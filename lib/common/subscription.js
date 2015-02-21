// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = SubscriptionFactory;

di.annotate(SubscriptionFactory, new di.Provide('Subscription'));
di.annotate(SubscriptionFactory,
    new di.Inject(
        'Q'
    )
);

function SubscriptionFactory (Q) {

    /**
     * Creates a new subscription to a queue
     * @param queue {string}
     * @constructor
     */
    function Subscription (queue) {
        this.queue = queue;
    }

    /**
     * Removes the subscription
     *
     * @returns {Q.promise}
     */
    Subscription.prototype.dispose = function () {
        return Q.resolve(this.queue.destroy());
    };

    return Subscription;
}

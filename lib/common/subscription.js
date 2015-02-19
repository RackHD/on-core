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
    function Subscription (queue) {
        this.queue = queue;
    }

    Subscription.prototype.dispose = function () {
        return Q.resolve(this.queue.destroy());
    };

    return Subscription;
}

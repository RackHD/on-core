// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = SubscriptionFactory;

di.annotate(SubscriptionFactory, new di.Provide('Subscription'));
di.annotate(SubscriptionFactory,
    new di.Inject(
        'Services.Assert'
    )
);

function SubscriptionFactory (assert) {
    function Subscription (messenger, options) {
        assert.ok(messenger);

        this.messenger = messenger;

        assert.ok(options);
        assert.ok(options.queue);
        assert.ok(options.consumerTag);

        this.options = options;
    }

    Subscription.prototype.dispose = function () {
        var self = this;

        self.messenger.cancel(self.options.consumerTag).then(function () {
            self.messenger.deleteQueue(self.options.queue);
        }).catch(function (error) {
            console.log(error);
        });
    };

    return Subscription;
}
// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = SubscriptionFactory;

di.annotate(SubscriptionFactory, new di.Provide('Subscription'));
di.annotate(SubscriptionFactory,
    new di.Inject(
        'Assert'
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

        Object.defineProperties(this, {
            consumerTag: {
                get: function () {
                    return this.options.consumerTag;
                },
                enumerable: true
            },
            queue: {
                get: function () {
                    return this.options.queue;
                },
                enumerable: true
            }
        });
    }

    Subscription.prototype.dispose = function () {
        var self = this;

        return self.messenger.cancel(self.consumerTag).then(function () {
            self.messenger.deleteQueue(self.queue);
        });
    };

    return Subscription;
}

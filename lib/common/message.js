// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

Error.stackTraceLimit = Infinity;

var di = require('di');

module.exports = MessageFactory;

di.annotate(MessageFactory, new di.Provide('Message'));
di.annotate(MessageFactory,
    new di.Inject(
        'Services.Assert'
    )
);

function MessageFactory (assert) {
    function Message (messenger, data, options) {
        assert.ok(messenger);
        assert.ok(data);

        this.messenger = messenger;
        this.data = data;
        this.options = options;
    }

    Message.prototype.respond = function (data) {
        assert.ok(data);
        assert.ok(this.options.properties);
        assert.ok(this.options.properties.replyTo);

        this.messenger.publish(
            '',
            this.options.properties.replyTo,
            data
        );
    };

    return Message;
}
// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = MessageFactory;

di.annotate(MessageFactory, new di.Provide('Message'));
di.annotate(MessageFactory,
    new di.Inject(
        'Assert',
        'Tracer'
    )
);

function MessageFactory (assert, tracer) {

    /**
     * Constructor for a message
     *
     * @param {*} messenger
     * @param {Object} data
     * @param {*} [options]
     * @constructor
     */
    function Message (messenger, data, options) {
        assert.ok(messenger);
        assert.ok(data);

        this.messenger = messenger;
        this.data = data;
        this.options = options;
    }

    /**
     * publishes a response for a given message using the replyTo property in
     * the message's options.
     *
     * @param {Object} data
     */
    Message.prototype.respond = function (data) {
        assert.ok(data);
        assert.ok(this.options.properties);
        assert.ok(this.options.properties.replyTo);

        this.messenger.respond(
            this.options.properties.replyTo,
            data,
            {
                correlationId: this.options.properties.correlationId,
                headers: tracer.active.clone()
            }
        );
    };

    return Message;
}

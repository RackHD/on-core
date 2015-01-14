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
        assert.ok(messenger, 'Messenger must be specified.');
        assert.object(data, 'Data must be an object.');
        assert.object(options, 'Options must be specified.');
        assert.object(options.fields, 'Options must contain a fields property.');
        assert.object(options.properties, 'Options must contain a properties property.');

        this.messenger = messenger;
        this.data = data;
        this.options = options;

        Object.defineProperties(this, {
            exchange: {
                get: function () {
                    return this.options.fields.exchange;
                },
                enumerable: true
            },
            routingKey: {
                get: function () {
                    return this.options.fields.routingKey;
                },
                enumerable: true
            },
            consumerTag: {
                get: function () {
                    return this.options.fields.consumerTag;
                },
                enumerable: true
            },
            correlationId: {
                get: function () {
                    return this.options.properties.correlationId;
                },
                enumerable: true
            },
            type: {
                get: function () {
                    return this.options.properties.type;
                },
                enumerable: true
            },
            headers: {
                get: function () {
                    return this.options.properties.headers;
                },
                enumerable: true
            },
            replyTo: {
                get: function () {
                    return this.options.properties.replyTo;
                },
                enumerable: true
            }
        });
    }

    /**
     * publishes a response for a given message using the replyTo property in
     * the message's options.
     *
     * @param {Object} data
     */
    Message.prototype.respond = function (data) {
        assert.ok(this.replyTo);

        this.messenger.respond(
            this.replyTo,
            data,
            {
                correlationId: this.correlationId,
                headers: tracer.active.clone()
            }
        );
    };

    return Message;
}

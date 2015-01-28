// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = MessageFactory;

di.annotate(MessageFactory, new di.Provide('Message'));
di.annotate(MessageFactory,
    new di.Inject(
        'Assert',
        'Tracer',
        di.Injector
    )
);

function MessageFactory (assert, tracer, injector) {

    /**
     * Constructor for a message
     *
     * @param {*} messenger
     * @param {Object} data
     * @param {*} [options]
     * @constructor
     */
    function Message (data) {
        assert.object(data, 'data');
        assert.object(data.fields, 'data.fields');
        assert.object(data.properties, 'data.properties');
        assert.ok(data.content, 'data.content');

        this.data = Message.deserialize(data.content, data.properties.type);

        this.fields = data.fields;
        this.properties = data.properties;

        Object.defineProperties(this, {
            exchange: {
                get: function () {
                    return this.fields.exchange;
                },
                enumerable: true
            },
            routingKey: {
                get: function () {
                    return this.fields.routingKey;
                },
                enumerable: true
            },
            consumerTag: {
                get: function () {
                    return this.fields.consumerTag;
                },
                enumerable: true
            },
            correlationId: {
                get: function () {
                    return this.properties.correlationId;
                },
                enumerable: true
            },
            type: {
                get: function () {
                    return this.properties.type;
                },
                enumerable: true
            },
            headers: {
                get: function () {
                    return this.properties.headers;
                },
                enumerable: true
            },
            replyTo: {
                get: function () {
                    return this.properties.replyTo;
                },
                enumerable: true
            }
        });
    }

    /**
     * publishes a response for a given message using the replyTo property in
     * the message's
     *
     * @param {Object} data
     */
    Message.prototype.respond = function (data) {
        assert.ok(this.replyTo, 'this.replyTo');

        var messenger = injector.get('Services.Messenger');

        messenger.respond(
            this.replyTo,
            data,
            {
                correlationId: this.correlationId,
                headers: tracer.active.clone()
            }
        );
    };

    Message.deserialize = function (data, type) {
        var object = JSON.parse(data.toString()),
            Type;

        // Attempt to derive the object for marshalling based on the type.
        try {
            Type = injector.get(type);
        } catch (error) {
            // noop
        }

        return Type !== undefined ? new Type(object): object;
    };

    return Message;
}

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
        assert.object(data, 'Data must be an object.');
        assert.object(data.fields, 'Data must contain a fields field.');
        assert.object(data.properties, 'Data must contain a properties field.');
        assert.ok(data.content, 'Data must contain a content field.');

        this.data = Message.deserialize(data.content);

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
        assert.ok(this.replyTo);

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

    Message.deserialize = function (data) {
        var object = JSON.parse(data.toString()),
            Type;

        // Attempt to derive the object for marshalling based on the type.
        try {
            Type = injector.get('Protocol.Objects.' + data.properties.type);
        } catch (error) {
            // noop
        }

        return Type !== undefined ? new Type(object): object;
    };

    return Message;
}

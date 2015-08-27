// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = MessageFactory;

MessageFactory.$provide = 'Message';
MessageFactory.$inject = [
    'Assert',
    'ErrorEvent',
    '$injector'
];

function MessageFactory (assert, ErrorEvent, injector) {

    /**
     * Constructor for a message
     *
     * @param {*} messenger
     * @param {Object} data
     * @param {*} [options]
     * @constructor
     */
    function Message (data, headers, deliveryInfo) {
        assert.object(data);
        assert.object(headers);
        assert.object(deliveryInfo);

        this.data = Message.factory(data, deliveryInfo.type);
        this.headers = headers;
        this.deliveryInfo = deliveryInfo;
    }

    Message.prototype.isRequest = function () {
        return this.deliveryInfo.replyTo !== undefined;
    };

    /**
     * publishes a response for a given message using the replyTo property in
     * the message's
     *
     * @param {Object} data
     */
    Message.prototype.respond = function (data) {
        assert.ok(this.deliveryInfo, 'deliveryInfo');
        assert.ok(this.deliveryInfo.replyTo, 'replyTo');

        var messenger = injector.get('Services.Messenger');

        return messenger.publish(
            '', // default exchange used for direct queues
            this.deliveryInfo.replyTo,
            data
        );
    };

    Message.prototype.resolve = function (data) {
        return this.respond(data);
    };

    Message.prototype.reject = function (error) {
        return this.respond(new ErrorEvent(error));
    };

    Message.factory = function (data, type) {
        var Type;

        // Attempt to derive the object for marshalling based on the type.
        try {
            Type = injector.get(type);
        } catch (error) {
            // noop
        }

        return Type !== undefined ? new Type(data): data;
    };

    return Message;
}

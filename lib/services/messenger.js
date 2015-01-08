// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = messengerServiceFactory;

di.annotate(messengerServiceFactory, new di.Provide('Services.Messenger'));
di.annotate(messengerServiceFactory,
    new di.Inject(
        'Q',
        'Services.Assert',
        'Services.Configuration',
        'amqp',
        'Message',
        '_'
    )
);

function messengerServiceFactory(Q, assert, configuration, amqp, Message, _) {
    function MessengerService () {
    }

    /**
     * Initializes an AMQP connection.
     *
     * @returns {Q.promise}
     */
    MessengerService.prototype.start = function () {
        var self = this,
            uri = configuration.get('amqp');

        assert.ok(uri);

        return amqp.connect(uri).then(function (connection) {
            self.connection = connection;

            return self.connection.createChannel().then(function (channel) {
                self.channel = channel;

                self.channel.on('close', self.closed.bind(self));
                self.channel.on('error', self.error.bind(self));

                return self;
            });
        });
    };

    /**
     * Stops and tears down an AMQP connection.
     *
     */
    MessengerService.prototype.stop = function () {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
    };

    /**
     * Publishes the JSON serialized from 'data' into AMQP based on exchange and routingKey.
     *
     * @param {string} exchange
     * @param {string} routingKey
     * @param {Object} data
     * @param {Object} [options]
     */
    MessengerService.prototype.publish = function (exchange, routingKey, data, options) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        this.channel.publish(exchange, routingKey, new Buffer(JSON.stringify(data)), options || {});
    };

    /**
     * Attaches a subscription callback to a given exchange and routingKey
     * @param {string} exchange
     * @param {string} routingKey
     * @param {function({Message})} callback
     * @returns {*}
     */
    MessengerService.prototype.subscribe = function (exchange, routingKey, callback) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        var self = this,
            subscription = {};

        return self.queue('', { exclusive: true }).then(function (result) {
            subscription.queue = result.queue;

            return self.bind(
                subscription.queue, exchange, routingKey
            ).then(function () {
                return self.consume(subscription.queue, callback);
            }).then(function () {
                return subscription;
            });
        }).catch(function (error) {
            console.log(error);
        });
    };

    /**
     * Make a request, using data, over AMQP using exchange and routingKey and return
     * a promise that resolves on a response.
     *
     * @param {string} exchange
     * @param {string} routingKey
     * @param {Object} data
     * @param {Object} [options]
     * @returns {Q.promise}
     */
    MessengerService.prototype.request = function (exchange, routingKey, data, options) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        var self = this,
            deferred = Q.defer();

        self.queue('', { exclusive: true }).then(function (queue) {
            self.consume(queue.queue, function (message) {
                // TODO: unsubscribe and remove queue
                deferred.resolve(message);
            });

            // TODO: add timeout/unsubscribe and remove queue

            self.publish(
                exchange,
                routingKey,
                data,
                _.merge(
                    options || {},
                    {
                        replyTo: queue.queue
                    }
                )
            );
        }).catch(function (error) {
            deferred.resolve(error);
        });

        return deferred.promise;
    };

    /**
     * Sends data over a Queue.
     *
     * @param {queue} queue
     * @param {Object} data
     * @param {Object} options
     */
    MessengerService.prototype.respond = function (queue, data, options) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        this.channel.sendToQueue(queue, data, options);
    };

    /**
     * Creates an exchange
     *
     * @param {string} exchange
     * @param {string} type
     * @param {Object} options
     * @returns {exchange}
     */
    MessengerService.prototype.exchange = function (exchange, type, options) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        assert.ok(exchange);
        assert.ok(type);

        return this.channel.assertExchange(exchange, type, options || {});
    };

    /**
     * Creates a queue that can be bound to an exchange
     * @param {string} name
     * @param {Object} options
     * @returns {queue}
     */
    MessengerService.prototype.queue = function (name, options) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        return this.channel.assertQueue(name || '', options);
    };

    /**
     * Binds a queue to a given exchange and routingKey
     *
     * @param queue
     * @param exchange
     * @param routingKey
     * @returns {*}
     */
    MessengerService.prototype.bind = function (queue, exchange, routingKey) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        assert.ok(queue);
        assert.ok(exchange);
        assert.ok(routingKey);

        return this.channel.bindQueue(queue, exchange, routingKey);
    };

    /**
     * Attaches a callback that processes Message objects passed through a Queue.
     *
     * @param {queue} queue
     * @param {function({Message})} callback
     * @returns {*}
     */
    MessengerService.prototype.consume = function (queue, callback) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        assert.ok(queue);
        assert.func(callback);

        var self = this;

        return this.channel.consume(
            queue,
            function (data) {
                callback(
                    new Message(
                        self,
                        JSON.parse(data.content.toString()),
                        {
                            properties: data.properties,
                            fields: data.fields
                        }
                    )
                );
            },
            {
                noAck: true,
                exclusive: true
            }
        );
    };

    MessengerService.prototype.error = function (error) {
        assert.ifError(error, 'Messenger Service Channel Closed');
    };

    MessengerService.prototype.closed = function () {
        assert.ok(false, 'Messenger Service Channel Closed');
    };

    return new MessengerService();
}

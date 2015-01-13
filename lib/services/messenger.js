// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = messengerServiceFactory;

di.annotate(messengerServiceFactory, new di.Provide('Services.Messenger'));
di.annotate(messengerServiceFactory,
    new di.Inject(
        'Q',
        'Assert',
        'amqp',
        'Message',
        'Subscription',
        'Tracer',
        'Context',
        '_',
        di.Injector
    )
);

function messengerServiceFactory(
    Q,
    assert,
    amqp,
    Message,
    Subscription,
    tracer,
    Context,
    _,
    injector
) {
    function MessengerService () {
        this.startupPriority = 2;
    }

    /**
     * Initializes an AMQP connection.
     *
     * @returns {Q.promise}
     */
    MessengerService.prototype.start = function () {
        var self = this;

        var configuration = injector.get('Services.Configuration');
        var uri = configuration.get('amqp');

        assert.ok(uri);

        return amqp.connect(uri)
            .then(function (connection) {
                self.connection = connection;

                return self.connection.createChannel();
            }).then(function (channel) {
                self.channel = channel;

                self.channel.on('close', self.closed.bind(self));
                self.channel.on('error', self.error.bind(self));

                return self;
            })
            .then(function() {
                var protocols = injector.getMatching(/Protocol.Exchanges\.(?!Base).*/);

                return Q.all(_.map(protocols, function(protocol) {
                    return protocol.start();
                }));
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

        options = options || {
            correlationId: tracer.active.id,
            type: data.constructor.name,
            headers: tracer.active.clone()
        };

        this.channel.publish(
            exchange,
            routingKey,
            new Buffer(JSON.stringify(data)),
            options
        );
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

        var self = this;

        return self.queue('', { exclusive: true }).then(function (result) {
            return self.bind(
                result.queue, exchange, routingKey
            ).then(function () {
                return self.consume(result.queue, callback);
            });
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

        var context = tracer.active;

        var self = this,
            deferred = Q.defer(),
            timeout = null,
            subscription = null;

        // Create an anonymous queue.
        self.queue('', { exclusive: true }).then(function (queue) {
            // Setup a subscription to the queue.
            self.consume(queue.queue, function (message) {
                clearTimeout(timeout);

                if (subscription) {
                    subscription.dispose();
                }

                deferred.resolve(message);
            }).then(function (sub) {
                // Update the subscription object for the consume
                subscription = sub;

                // Set a timeout for the response.
                timeout = setTimeout(function () {
                    clearTimeout(timeout);

                    if (subscription) {
                        subscription.dispose();
                    }

                    deferred.reject(new Error('Request Timed Out.'));
                }, 2000);

                // Publish the request message.
                // Needs to run with context because the async call from when.js
                // isn't executed in the correct domain.
                tracer.run(function () {
                    self.publish(
                        exchange,
                        routingKey,
                        data,
                        _.merge(
                            options || {},
                            {
                                replyTo: queue.queue,
                                correlationId: context.id,
                                type: data.constructor.name,
                                headers: context.clone()
                            }
                        )
                    );
                }, context.id);
            }).catch(function (error) {
                deferred.reject(error);
            });

        }).catch(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
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

        return self.channel.consume(
            queue,
            function (data) {
                // Run with the context id provided by the correlationId.
                tracer.run(function () {
                    var Type;

                    // Attempt to derive the object for marshalling based on the type.
                    try {
                        Type = injector.get('Protocol.Objects.' + data.properties.type);
                    } catch (error) {
                        // noop
                    }

                    // Parse the object from the wire.
                    var object = JSON.parse(data.content.toString());

                    callback(
                        new Message(
                            self,
                            // Create a new object if applicable or use the default object.
                            Type !== undefined ? new Type(object): object,
                            {
                                properties: data.properties,
                                fields: data.fields
                            }
                        )
                    );
                }, data.properties.correlationId, data.properties.headers);
            },
            {
                noAck: true,
                exclusive: true
            }
        ).then(function (result) {
            return new Subscription(
                self,
                _.merge(
                    {
                        queue: queue
                    },
                    result
                )
            );
        });
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

        assert.ok(queue);
        assert.object(data);

        this.channel.sendToQueue(queue, new Buffer(JSON.stringify(data)), options || {});
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

    MessengerService.prototype.cancel = function (consumerTag) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        return this.channel.cancel(consumerTag);
    };

    MessengerService.prototype.deleteQueue = function (queue) {
        assert.ok(this.connection);
        assert.ok(this.channel);

        return this.channel.deleteQueue(queue);
    };

    MessengerService.prototype.error = function (error) {
        assert.ifError(error, 'Messenger Service Channel Closed');
    };

    MessengerService.prototype.closed = function () {
        assert.ok(false, 'Messenger Service Channel Closed');
    };

    return new MessengerService();
}

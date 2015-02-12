// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = messengerServiceFactory;

di.annotate(messengerServiceFactory, new di.Provide('Services.Messenger'));
di.annotate(messengerServiceFactory,
    new di.Inject(
        'Constants',
        'Q',
        'Assert',
        'amqp',
        'Message',
        'Subscription',
        'Tracer',
        'Context',
        '_',
        'ErrorEvent',
        'Serializable',
        di.Injector
    )
);

function messengerServiceFactory(
    Constants,
    Q,
    assert,
    amqp,
    Message,
    Subscription,
    tracer,
    Context,
    _,
    ErrorEvent,
    Serializable,
    injector
) {
    function MessengerService () {
        this.startupPriority = 1;

        this.subscriptions = {};
    }

    /**
     * Initializes an AMQP connection.
     *
     * @returns {Q.promise}
     */
    MessengerService.prototype.start = function () {
        var self = this,
            configuration = injector.get('Services.Configuration'),
            uri = configuration.get('amqp');

        assert.ok(uri, 'uri');

        return amqp.connect(uri)
            .then(function (connection) {
                self.connection = connection;

                return self.connection.createChannel();
            }).then(function (channel) {
                self.channel = channel;

                return self;
            })
            .then(function() {
                var promises = _.mapValues(Constants.Protocol.Exchanges,
                    function (exchange) {
                        return self.exchange(
                            exchange.Name,
                            exchange.Type,
                            exchange.Options
                        );
                    }
                );

                return Q.all(promises);
            });
    };

    /**
     * Stops and tears down an AMQP connection.
     *
     */
    MessengerService.prototype.stop = function () {
        var self = this;

        var promises = _.values(this.subscriptions, function (subscription) {
            return subscription.dispose();
        });

        return Q.allSettled(promises).then(function () {
            return self.channel.close().then(function () {
                delete self.channel;

                return self.connection.close().then(function () {
                    delete self.connection;
                });
            });
        });
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
        var self = this;

        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.string(exchange, 'exchange');
        assert.string(routingKey, 'routingKey');
        assert.object(data, 'data');

        options = options || {
            correlationId: tracer.active.id,
            type: data.constructor.provides || 'Object',
            headers: tracer.active.clone()
        };

        return this.validate(data).then(function () {
            return self.channel.publish(
                exchange,
                routingKey,
                new Buffer(JSON.stringify(data)),
                options
            );
        });
    };

    /**
     * Attaches a subscription callback to a given exchange and routingKey
     * @param {string} exchange
     * @param {string} routingKey
     * @param {function({Message})} callback
     * @returns {*}
     */
    MessengerService.prototype.subscribe = function (exchange, routingKey, callback, type) {
        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.string(exchange, 'exchange');
        assert.string(routingKey, 'routingKey');
        assert.func(callback, 'callback');

        var self = this;

        return self.queue('', { exclusive: true }).then(function (result) {
            return self._bind(
                result.queue, exchange, routingKey
            ).then(function () {
                return self.consume(result.queue, callback, type);
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
    MessengerService.prototype.request = function (exchange, routingKey, data, type) {
        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.string(exchange, 'exchange');
        assert.string(routingKey, 'routingKey');
        assert.object(data, 'data');

        var context = tracer.active;

        var self = this,
            deferred = Q.defer(),
            timeout = null,
            subscription = null;

        // Create an anonymous queue.
        self.queue('', { exclusive: true }).then(function (queue) {
            // Setup a subscription to the queue.
            self.consume(queue.queue, function (data) {
                clearTimeout(timeout);

                if (subscription) {
                    subscription.dispose();
                }

                if (data instanceof ErrorEvent) {
                    deferred.reject(data);
                } else {
                    deferred.resolve(data);
                }
            }, type).then(function (sub) {
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
                        {
                            replyTo: queue.queue,
                            correlationId: context.id,
                            type: data.constructor.provides || 'Object',
                            headers: context.clone()
                        }
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
    MessengerService.prototype.consume = function (queue, callback, type) {
        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.ok(queue, 'queue');
        assert.func(callback,'callback');

        var self = this;

        return self.channel.consume(
            queue,
            function (data) {
                var message = new Message(data);

                if (_.isFunction(type)) {

                    assert.ok(message.data instanceof type);
                    assert.ok(message.data instanceof Serializable);

                    message.data.validate().then(function () {
                        tracer.run(function () {
                            callback(message.data, message);
                        }, message.correlationId, message.headers);
                    }).catch(function (error) {
                        console.log('Object Not Valid');
                        console.log(error);
                    });
                } else {
                    tracer.run(function () {
                        callback(message.data, message);
                    }, message.correlationId, message.headers);
                }
            },
            {
                noAck: true,
                exclusive: true
            }
        ).then(function (result) {
            var subscription = new Subscription(self, _.merge({ queue: queue }, result));

            // Cache subscriptions by consumer tag for disposal on stop.
            self.subscriptions[subscription.consumerTag] = subscription;

            return subscription;
        });
    };

    /**
     * Sends data over a Queue.
     *
     * @param {queue} queue
     * @param {Object} data
     * @param {Object} options
     */
    MessengerService.prototype.respond = function (queue, data) {
        var self = this;

        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.ok(queue, 'queue');
        assert.object(data, 'data');

        var options = {
            correlationId: tracer.active.id,
            type: data.constructor.provides || 'Object',
            headers: tracer.active.clone()
        };

        return this.validate(data).then(function () {
            return self.channel.sendToQueue(
                queue,
                new Buffer(JSON.stringify(data)),
                options
            );
        });
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
        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.string(exchange, 'exchange');
        assert.string(type, 'type');

        return this.channel.assertExchange(exchange, type, options || {});
    };

    /**
     * Creates a queue that can be bound to an exchange
     * @param {string} name
     * @param {Object} options
     * @returns {queue}
     */
    MessengerService.prototype.queue = function (name, options) {
        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.string(name, 'name');

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
    MessengerService.prototype._bind = function (queue, exchange, routingKey) {
        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.string(queue, 'queue');
        assert.string(exchange, 'exchange');
        assert.string(routingKey, 'routingKey');

        return this.channel.bindQueue(queue, exchange, routingKey);
    };

    MessengerService.prototype.cancel = function (consumerTag) {
        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.string(consumerTag, 'consumerTag');

        var self = this;

        return self.channel.cancel(consumerTag).then(function () {
            delete self.subscriptions[consumerTag];
        });
    };

    MessengerService.prototype.deleteQueue = function (queue) {
        assert.ok(this.connection, 'this.connection');
        assert.ok(this.channel, 'this.channel');

        assert.string(queue, 'queue');

        return this.channel.deleteQueue(queue);
    };

    MessengerService.prototype.validate = function (data) {
        if (data instanceof Serializable) {
            return data.validate();
        } else {
            return Q.resolve();
        }
    };

    return new MessengerService();
}

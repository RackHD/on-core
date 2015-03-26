// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = messengerFactory;

di.annotate(messengerFactory, new di.Provide('Messenger'));
di.annotate(messengerFactory,
    new di.Inject(
        'Constants',
        'Q',
        'Assert',
        'Connection',
        'Message',
        'Subscription',
        'Tracer',
        'Context',
        '_',
        'ErrorEvent',
        'Serializable',
        'shortid',
        di.Injector
    )
);

function messengerFactory(
    Constants,
    Q,
    assert,
    Connection,
    Message,
    Subscription,
    tracer,
    Context,
    _,
    ErrorEvent,
    Serializable,
    shortid,
    injector
) {
    var queueOptions = {
        exclusive: true
    };

    var subscribeOptions = {
        exclusive: true
    };

    /**
     * validates data based on whether it is a serializable or not
     * @param  {Object|Serializable} data
     * @return {Promise}
     */
    function validate(data) {
        if (data instanceof Serializable) {
            return data.validate();
        } else {
            return Q.resolve();
        }
    }

    /**
     * Generates a random queue name based on the name/routingKey that
     * the queue is going to be bound to.
     */
    function queueName(name, routingKey) {
        return '%s:%s:%s'.format(name, routingKey, shortid.generate());
    }

    function Messenger () {
        this.startupPriority = 1;

        this.subscriptions = {};

        this.timeout = 1000;
    }

    /**
     * Initializes an AMQP connection.
     *
     * @returns {Q.promise}
     */
    Messenger.prototype.start = function () {
        var self = this,
            configuration = injector.get('Services.Configuration'),
            uri = configuration.get('amqp');

        assert.ok(uri, 'uri');

        var options = {
                url: uri
            },
            clientOptions = {
                reconnect: true,
                reconnectBackoffStrategy: 'linear',
                reconnectExponentialLimit: 120000,
                reconnectBackoffTime: 1000
            };

        // Setup Trasnsmit Connection.
        this.transmit = new Connection (options, clientOptions);

        this.transmit.on('error', function (error) {
            console.log('Transmit Error', error.message);
        });

        // Setup Receive Connection
        this.receive = new Connection(options, clientOptions);

        this.receive.on('error', function (error) {
            console.log('Receive Error', error.message);
        });

        return Q.all([
            this.transmit.start(),
            this.receive.start()
        ]).then(function () {
            _.mapValues(Constants.Protocol.Exchanges, function (exchange) {
                self.receive.exchange(exchange.Name, exchange.Options);
                self.transmit.exchange(exchange.Name, exchange.Options);
            });
        });
    };

    /**
     * Stops and tears down an AMQP connection.
     */
    Messenger.prototype.stop = function () {
        return Q.all([
            this.transmit.stop(),
            this.receive.stop()
        ]);
    };

    /**
     * Publishes the JSON serialized from 'data' into AMQP based on exchange and routingKey.
     *
     * @param {string} name
     * @param {string} routingKey
     * @param {Object} data
     * @param {Object} options TODO: Frey to say what options are valid here
     * @returns {Q.Promise}
     */
    Messenger.prototype.publish = function (name, routingKey, data, options) {
        assert.string(name, 'name');
        assert.string(routingKey, 'routingKey');
        assert.object(data, 'data');

        if (_.isUndefined(this.transmit)) {
            return Q.reject(new Error('Connection Not Established.'));
        }

        if (!_.isEmpty(name) && !_.has(this.transmit.exchanges, name)) {
            return Q.reject(new Error(
                'Invalid Exchange Specified for Publish (%s:%s).'.format(name, routingKey)
            ));
        }

        var self = this;

        options = options || {};

        // This handles setup of the default publishing options.
        _.merge(options, {
            correlationId: tracer.active.id,
            type: data.constructor.provides || 'Object',
            headers: tracer.active.clone()
        });

        // Validate, get the exchange, then publish.
        return validate(data).then(function () {
            return self.transmit.exchange(name).then(function (exchange) {
                // Publish is async, even with exchange confirm on the callback for it
                // doesn't seem to fire as documented so there isn't necessarily a reason
                // to use confirm mode.
                exchange.publish(routingKey, data, options);
            });
        });
    };

    /**
     * Attaches a subscription callback to a given exchange and routingKey
     * @param {string} exchange
     * @param {string} routingKey
     * @param {function({Message})} callback
     * @param {Object} type TODO: Frey to say how to use type
     * @returns {Q.Promise}
     */
    Messenger.prototype.subscribe = function (name, routingKey, callback, type) {
        assert.string(name, 'name');
        assert.string(routingKey, 'routingKey');
        assert.func(callback, 'callback');

        var deferred = Q.defer();

        if (_.has(this.receive.exchanges, name)) {
            // Create an anonymous queue for the subscription.
            this.receive.queue(queueName(name, routingKey), queueOptions, function (q) {
                // Bind the queue to the exchange and routing key as provided.
                q.bind(name, routingKey, function () {
                    // Subscribe to the queue.
                    q.subscribe(subscribeOptions, function (data, headers, deliveryInfo) {
                        var message = new Message(data, headers, deliveryInfo);

                        // Validate the message and reject if it is a request object.
                        validate(message.data).then(function () {
                            // Check the configured type for the subscriber.
                            if (_.isFunction (type) && !(message.data instanceof type)) {
                                throw new Error(
                                    'Invalid Request Type (%s:%s:%s).'.format(
                                        name,
                                        routingKey,
                                        type || 'Object'
                                    )
                                );
                            }

                            // Run within the context of the tracer.
                            tracer.run(function () {
                                callback(message.data, message);
                            }, deliveryInfo.correlationId, headers);
                        }).catch(function (error) {
                            /* istanbul ignore else */
                            if (message.isRequest()) {
                                message.reject(error);
                            }
                        });
                    }).addCallback(function (options) {
                        // This let's us know the subscription completed and we're able to
                        // resolve the subscription object.
                        deferred.resolve(new Subscription(q, options));
                    });
                });
            });
        } else {
            deferred.reject(
                new Error(
                    'Invalid Exchange Specified for Subscription (%s:%s:%s).'.format(
                        name,
                        routingKey,
                        type || 'Object'
                    )
                )
            );
        }

        return deferred.promise;
    };

    /**
     * Make a request, using data, over AMQP using exchange and routingKey and return
     * a promise that resolves on a response.
     *
     * @param {string} name
     * @param {string} routingKey
     * @param {Object} data
     * @param {Object} type TODO: Frey to say how to use type
     * @returns {Q.Promise}
     */
    Messenger.prototype.request = function (name, routingKey, data, type) {
        assert.string(name, 'name');
        assert.string(routingKey, 'routingKey');
        assert.object(data, 'data');

        var self = this,
            deferred = Q.defer(),
            subscription,
            timeout;

        this.receive.queue(queueName(name, routingKey), queueOptions, function (q) {
            q.subscribe(subscribeOptions, function (data, headers, deliveryInfo) {
                clearTimeout(timeout);

                if (subscription) {
                    subscription.dispose();
                }

                var message = new Message(data, headers, deliveryInfo);

                if (message.data instanceof ErrorEvent) {
                    deferred.reject(message.data);
                } else {
                    if (_.isFunction(type) && !(message.data instanceof type)) {
                        deferred.reject(
                            new Error('Invalid Response Type (%s:%s:%s).',
                                name,
                                routingKey,
                                type || 'Object'
                            )
                        );
                    } else {
                        deferred.resolve(message.data);
                    }
                }
            }).addCallback(function (options) {
                timeout = setTimeout(function () {
                    clearTimeout(timeout);

                    if (subscription) {
                        subscription.dispose();
                    }

                    deferred.reject(
                        new Error(
                            'Request Timed Out (%s:%s:%s).'.format(
                                name,
                                routingKey,
                                type || 'Object'
                            )
                        )
                    );
                }, self.timeout);

                subscription = new Subscription(q, options);

                self.publish(name, routingKey, data, {
                    replyTo: q.name
                });
            });
        });

        return deferred.promise;
    };

    return Messenger;
}

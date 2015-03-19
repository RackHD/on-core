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
    var queueOptions = {
        closeChannelOnUnsubscribe: true,
        autoDelete: true
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

    function MessengerService () {
        this.startupPriority = 1;

        this.subscriptions = {};

        this.timeout = 1000;
    }

    /**
     * Initializes an AMQP connection.
     *
     * @returns {Q.promise}
     */
    MessengerService.prototype.start = function () {
        var self = this,
            configuration = injector.get('Services.Configuration'),
            uri = configuration.get('amqp'),
            deferred = Q.defer();

        assert.ok(uri, 'uri');

        this.connection = amqp.createConnection({
            url: uri
        }, {
            reconnect: true,
            reconnectBackoffStrategy: 'linear',
            reconnectExponentialLimit: 120000,
            reconnectBackoffTime: 1000
        });

        this.connection.on('ready', function () {
            // These are run synchronously because the amqp library exchange ready callback
            // isn't accurate.
            _.mapValues(Constants.Protocol.Exchanges, function (exchange) {
                self.connection.exchange(exchange.Name, exchange.Options);
            });

            deferred.resolve();
        });

        this.connection.on('error', function (error) {
            switch(error.code) {
                case 404:
                    // In the case of 404 messages related to exchanges we need to verify
                    // that the exchange indeed does not exist prior to notifying anyone about
                    // it.
                    var matches = error.message.match(
                            /^NOT_FOUND - no exchange '([^']*)' in vhost '([^']*)'$/
                        ),
                        exchange = matches ? matches[1] : undefined;

                    // If the error is exchange related we'll report it if the exchange doesn't
                    // exist on the active connection object.
                    if (exchange !== undefined) {
                        if (!_.has(self.connection.exchanges, exchange)) {
                            console.log(error);
                            console.log(error.stack);
                        }
                    }

                    break;

                default:
                    // Other errors we'll report as usual and then apply special case semantics
                    // where appropriate as was the case in the 404 exchange not found case.
                    console.log(error);
                    console.log(error.stack);
            }
        });

        return deferred.promise;
    };

    /**
     * Stops and tears down an AMQP connection.
     *
     */
    MessengerService.prototype.stop = function () {
        var deferred = Q.defer();

        this.connection.on('close', function () {
            deferred.resolve();
        });

        this.connection.disconnect();

        return deferred.promise;
    };

    MessengerService.prototype.exchange = function (name, options) {
        var deferred = Q.defer();

        // This is a workaround due to the amqp library's lack of intelligence
        // around declaring an exchange versus asking for a reference to an
        // exchange for publishing.
        if (_.has(this.connection.exchanges, name)) {
            deferred.resolve(this.connection.exchanges[name]);
        } else {
            // If no name is specified return the default exchange.
            if (_.isEmpty(name)) {
                deferred.resolve(this.connection.exchange());
            } else {
                if (_.isObject(options)) {
                    this.connection.exchange(name, options, function (exchange) {
                        deferred.resolve(exchange);
                    });
                } else {
                    deferred.reject(new Error('Unable to Create Exchange without Options.'));
                }
            }
        }

        return deferred.promise;
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
    MessengerService.prototype.publish = function (name, routingKey, data, options) {
        assert.string(name, 'exchange');
        assert.string(routingKey, 'routingKey');
        assert.object(data, 'data');

        if (_.isUndefined(this.connection)) {
            return Q.reject(new Error('Connection Not Established.'));
        }

        if (!_.isEmpty(name) && !_.has(this.connection.exchanges, name)) {
            return Q.reject(new Error('Invalid Exchange Specified for Publish.'));
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
            return self.exchange(name).then(function (exchange) {
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
    MessengerService.prototype.subscribe = function (exchange, routingKey, callback, type) {
        assert.string(exchange, 'exchange');
        assert.string(routingKey, 'routingKey');
        assert.func(callback, 'callback');

        var deferred = Q.defer();

        if (_.has(this.connection.exchanges, exchange)) {
            // Create an anonymous queue for the subscription.
            this.connection.queue('', queueOptions, function (q) {
                // Bind the queue to the exchange and routing key as provided.
                q.bind(exchange, routingKey, function () {
                    // Subscribe to the queue.
                    q.subscribe(function (data, headers, deliveryInfo) {
                        var message = new Message(data, headers, deliveryInfo);

                        // Validate the message and reject if it is a request object.
                        validate(message.data).then(function () {
                            // Check the configured type for the subscriber.
                            if (_.isFunction (type) && !(message.data instanceof type)) {
                                throw new Error('Invalid Request Type.');
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
                    }).addCallback(function () {
                        // This let's us know the subscription completed and we're able to
                        // resolve the subscription object.
                        deferred.resolve(new Subscription(q));
                    });
                });
            });
        } else {
            deferred.reject(new Error('Invalid Exchange Specified for Subscription.'));
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
    MessengerService.prototype.request = function (name, routingKey, data, type) {
        assert.string(name, 'name');
        assert.string(routingKey, 'routingKey');
        assert.object(data, 'data');

        var self = this,
            deferred = Q.defer(),
            subscription,
            timeout;

        this.connection.queue('', queueOptions, function (q) {
            q.subscribe(function (data, headers, deliveryInfo) {
                clearTimeout(timeout);

                /* istanbul ignore else */
                if (subscription) {
                    subscription.dispose();
                }

                var message = new Message(data, headers, deliveryInfo);

                if (message.data instanceof ErrorEvent) {
                    deferred.reject(message.data);
                } else {
                    if (_.isFunction(type) && !(message.data instanceof type)) {
                        deferred.reject(new Error('Invalid Response Type.'));
                    } else {
                        deferred.resolve(message.data);
                    }
                }
            }).addCallback(function () {
                timeout = setTimeout(function () {
                    clearTimeout(timeout);

                    /* istanbul ignore else */
                    if (subscription) {
                        subscription.dispose();
                    }

                    deferred.reject(new Error('Request Timed Out.'));
                }, self.timeout);

                subscription = new Subscription(q);

                self.publish(name, routingKey, data, {
                    replyTo: q.name
                });
            });
        });

        return deferred.promise;
    };

    return new MessengerService();
}

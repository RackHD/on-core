// Copyright 2015, EMC, Inc.

'use strict';

module.exports = messengerFactory;

messengerFactory.$provide = 'Messenger';
messengerFactory.$inject = [
    'Constants',
    'Promise',
    'Assert',
    'Connection',
    'Message',
    'Subscription',
    '_',
    'Errors',
    'ErrorEvent',
    'Serializable',
    'shortid',
    'Timer',
    'Services.StatsD',
    '$injector'
];

function messengerFactory(
    Constants,
    Promise,
    assert,
    Connection,
    Message,
    Subscription,
    _,
    Errors,
    ErrorEvent,
    Serializable,
    shortid,
    Timer,
    statsd,
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
            return Promise.resolve();
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
        this.initialConnection = false;
        this.subscriptions = {};
        this.timeout = 1000;
    }

    /**
     * Initializes an AMQP connection.
     *
     * @returns {Promise}
     */
    Messenger.prototype.start = function () {
        var self = this,
            configuration = injector.get('Services.Configuration'),
            uri = configuration.get('amqp', 'amqp://localhost');

        assert.ok(uri, 'uri');

        var options;

        if (typeof uri === 'string') {
            options = {
                url: uri
            };
        } else if (typeof uri === 'object') {
            options = uri;
        } else {
            console.log('Setting AMQP URL to localhost');
            options = {
                url: 'amqp://localhost'
            };
        }

        options.ssl = configuration.get('amqpSsl', {enabled: false});

        var clientOptions = {
            reconnect: true,
            reconnectBackoffStrategy: 'linear',
            reconnectExponentialLimit: 120000,
            reconnectBackoffTime: 1000
        };

        this.transmit = new Connection (options, clientOptions, 'transmit');
        this.receive = new Connection(options, clientOptions, 'receive');

        return Promise.all([
            self.transmit.start(),
            self.receive.start()
        ]).then(function () {
            _.mapValues(Constants.Protocol.Exchanges, function (exchange) {
                self.receive.exchange(exchange.Name, exchange.Options);
                self.transmit.exchange(exchange.Name, exchange.Options);
            });
        })
        .then(function() {
            self.transmit.initialConnection = true;
            self.receive.initialConnection = true;
        })
        .catch(function(err) {
            // Console log this since the logger may fail without the messenger,
            // which itself is a seperate issue.
            // TODO: remove console.log when the above ^^ comment is fixed.
            console.log(err);
            throw err;
        });
    };

    /**
     * Stops and tears down an AMQP connection. This will also reset the exchanges/queue 
     */
    Messenger.prototype.stop = function () {
        var self = this;

        if (self.transmit && self.receive) {
            return Promise.all([
                self.transmit.stop(),
                self.receive.stop()
            ]);
        } else {
            return Promise.resolve();
        }
    };

    /**
     * Publishes the JSON serialized from 'data' into AMQP based on exchange and routingKey.
     *
     * @param {string} name
     * @param {string} routingKey
     * @param {Object} data
     * @param {Object} options TODO: Frey to say what options are valid here
     * @returns {Promise}
     */
    Messenger.prototype.publish = function (name, routingKey, data, options) {
        assert.string(name, 'name');
        assert.string(routingKey, 'routingKey');
        assert.object(data, 'data');

        if (_.isUndefined(this.transmit)) {
            return Promise.reject(new Error('Connection Not Established.'));
        }

        if (!_.isEmpty(name) && !_.has(this.transmit.exchanges, name)) {
            return Promise.reject(new Error(
                'Invalid Exchange Specified for Publish (%s:%s).'.format(name, routingKey)
            ));
        }

        var self = this;

        options = options || {};

        // This handles setup of the default publishing options.
        _.merge(options, {
            type: data.constructor.provides || 'Object'
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
     * Attaches a subscription callback to a given exchange and routingKey, 
	 * callback param is the function name to be invoked on message
     * @param {string} exchange
     * @param {string} routingKey
     * @param {function({Message})} callback
     * @param {Object} type TODO: Frey to say how to use type
     * @returns {Promise}
     */
    Messenger.prototype.subscribe = function (name, routingKey, callback, type) {
        assert.string(name, 'name');
        assert.string(routingKey, 'routingKey');
        assert.func(callback, 'callback');

        var self = this;

        return new Promise(function (resolve, reject) {
            if (_.has(self.receive.exchanges, name)) {
                // Create an anonymous queue for the subscription.
                self.receive.queue(queueName(name, routingKey), queueOptions, function (q) {
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

                                callback(message.data, message);
                            }).catch(function (error) {
                                /* istanbul ignore else */
                                if (message.isRequest()) {
                                    message.reject(error);
                                }
                            });
                        }).addCallback(function (options) {
                            // This let's us know the subscription completed and we're able to
                            // resolve the subscription object.
                            resolve(new Subscription(q, options));
                        });
                    });
                });
            } else {
                reject(
                    new Error(
                        'Invalid Exchange Specified for Subscription (%s:%s:%s).'.format(
                            name,
                            routingKey,
                            type || 'Object'
                        )
                    )
                );
            }
        });
    };

    /**
     * Make a request, using data, over AMQP using exchange and routingKey and return
     * a promise that resolves on a response.
     *
     * @param {string} name
     * @param {string} routingKey
     * @param {Object} data
     * @param {Object} type The constructor of the expected type for the response.
     * @param {number} Override default messenger timeout
     * @returns {Promise}
     */
    Messenger.prototype.request = function (name, routingKey, data, type, timeout) {
        assert.string(name, 'name');
        assert.string(routingKey, 'routingKey');
        assert.object(data, 'data');

        var self = this,
            timer = new Timer();

        var context = {
            subscription: null,
            timeout: null,
            timeoutDuration: timeout,
            name: name,
            routingKey: routingKey,
            type: type,
            data: data,
            timer: timer,
            queue: null,
            resolve: null,
            reject: null,
        };

        return new Promise(function (resolve, reject) {
            context.resolve = resolve;
            context.reject = reject;
            self.receive.queue(
                queueName(name, routingKey + '.request'),
                queueOptions,
                function (q) {
                    context.queue = q;
                    q.subscribe(
                        subscribeOptions,
                        self.subscribeTimeout.bind(self, context)
                    )
                    .addCallback(self.subscribeCallback.bind(self, context));
                }
            );
        });
    };

   /* previously there had been a race condition where subscription.dispose
    *  would be called twice when there was a timeout. This function only
    *  executes when dispose has not already been called.
    */
    Messenger.prototype.safeSubscriptionDispose = function (context) {
        context.subscription && !context.subscription._disposed && context.subscription.dispose();
    };

    Messenger.prototype.subscribeTimeout = function(context, data, headers, deliveryInfo) {
        clearTimeout(context.timeout);

        this.safeSubscriptionDispose(context);

        statsd.timing(
            statsd.sanitize(
                'messenger.%s.%s'.format(
                    context.name,
                    context.routingKey
                )
            ),
            context.timer.stop()
        );

        var message = new Message(data, headers, deliveryInfo);

        if (message.data instanceof ErrorEvent) {
            return context.reject(message.data);
        } else {
            if (_.isFunction(context.type) && !(message.data instanceof context.type)) {
                return context.reject(
                   new Error(
                        'Invalid Response Type (%s:%s:%s).'.format(
                            context.name,
                            context.routingKey,
                            context.type || 'Object'
                        )
                    )
                );
            } else {
                return context.resolve(message.data);
            }
        }
    };

    Messenger.prototype.subscribeCallback = function(context, options) {
        var self = this;
        context.timeout = setTimeout(function () {
            clearTimeout(context.timeout);

            self.safeSubscriptionDispose(context);

            return context.reject (
                new Errors.RequestTimedOutError(
                    'Request Timed Out (%s:%s:%s). %s ms'.format(
                        context.name,
                        context.routingKey,
                        context.type || 'Object',
                        context.timeoutDuration || self.timeout
                    )
                )
            );
        }, context.timeoutDuration || self.timeout);

        context.subscription = Subscription.create(context.queue, options);

        context.timer.start();

        self.publish(context.name, context.routingKey, context.data, {
            replyTo: context.queue.name
        });
    };

    return Messenger;
}

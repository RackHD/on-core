// Copyright 2015, EMC, Inc.

'use strict';

module.exports = connectionFactory;

connectionFactory.$provide = 'Connection';
connectionFactory.$inject = [
    'Assert',
    'amqp',
    'Promise',
    'Util',
    '_'
];

function connectionFactory (assert, amqp, Promise, util, _) {
    /**
     * Connection provides a wrapper around the AMQP connection logic
     * which presents a simplified interface for using multiple connections
     * in the messenger.
     * @param {Object} options       node-amqp createConnection options.
     * @param {type} [clientOptions] node-amqp createConnection client options.
     */
    function Connection (options, clientOptions, label) {
        this.options = options;
        this.clientOptions = clientOptions;
        this.label = label;
        this.initialConnection = false;
        this.initialConnectionRetries = 0;
        this.maxConnectionRetries = 60;

        Object.defineProperty(this, 'exchanges', {
            get: function () {
                if (this.connection) {
                    return this.connection.exchanges;
                }
            }
        });

        Object.defineProperty(this, 'connected', {
            get: function () {
                return this.connection !== undefined;
            }
        });
    }

    /**
     * Starts the Connection
     * @return {Promise}
     */
    Connection.prototype.start = function() {
        var self = this;

        return new Promise(function (resolve, reject) {
            if (self.connection) {
                reject(new Error('Connection Already Started.'));
            } else {
                // Create a new connection and setup listeners.
                self.connection = new amqp.createConnection(
                    self.options,
                    self.clientOptions
                );

                self.connection.on('ready', function () {
                    resolve();
                });

                self.connection.on('error', function (error) {
                    // Suppress ECONNRESET which is very prevalent on Ubuntu
                    // when working with RabbitMQ.
                    if (error.code === 'ECONNRESET') {
                        return;
                    }
                    if (self.initialConnection) {
                        console.log('AMQP %s Error (%s)'.format(self.label, self.options.url),
                                    error.message);
                    } else {
                        if (self.initialConnectionRetries > self.maxConnectionRetries) {
                            reject(new Error(
                                    'Exceeded max retries attempting to start AMQP connection to ' +
                                    self.options.url));
                        }
                        self.initialConnectionRetries += 1;
                        console.log('Error creating initial AMQP %s connection (%s), retrying...'
                                .format(self.label, self.options.url), error.message);
                    }
                });
            }
        });
    };

    /**
     * Stops the Connection
     * @return {Promise}
     */
    Connection.prototype.stop = function() {
        var self = this;

        return new Promise(function (resolve, reject) {
            if (self.connection) {
                self.connection.on('close', function () {
                    delete self.connection;
                    resolve();
                });

                self.connection.disconnect();
            } else {
                reject(new Error('Connection Not Started.'));
            }
        });
    };

    /**
     * Proxies to amqp.Connection.exchange
     * @param  {String}   name
     * @param  {Object}   options
     * @return {Promise}
     */
    Connection.prototype.exchange = function(name, options) {
        var self = this;

        return new Promise(function (resolve, reject) {
            if (!self.connection) {
                reject(new Error('Connection Not Established.'));
            } else {
                // This is a workaround due to the amqp library's lack of intelligence
                // around declaring an exchange versus asking for a reference to an
                // exchange for publishing.
                if (_.has(self.connection.exchanges, name)) {
                    resolve(self.connection.exchanges[name]);
                } else {
                    // If no name is specified return the default exchange.
                    if (_.isEmpty(name)) {
                        resolve(self.connection.exchange());
                    } else {
                        if (_.isObject(options)) {
                            self.connection.exchange(name, options, function (exchange) {
                                resolve(exchange);
                            });
                        } else {
                            reject(new Error('Unable to Create Exchange without Options.'));
                        }
                    }
                }
            }
        });
    };

    /**
     * Proxies to amqp.Connection.queue
     * @param  {String}   name
     * @param  {Object}   options
     * @param  {Function} callback Optional, returns promise if not used.
     * @return {Promise}
     */
    Connection.prototype.queue = function(name, options, callback) {
        return this.connection.queue(name, options, callback);
    };

    return Connection;
}

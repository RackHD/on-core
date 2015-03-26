
// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = connectionFactory;

di.annotate(connectionFactory, new di.Provide('Connection'));
di.annotate(connectionFactory,
    new di.Inject(
        'Assert',
        'amqp',
        'Q',
        'EventEmitter',
        'Util',
        '_'
    )
);

function connectionFactory (assert, amqp, Q, EventEmitter, util, _) {
    /**
     * Connection provides a wrapper around the AMQP connection logic
     * which presents a simplified interface for using multiple connections
     * in the messenger.
     * @param {Object} options       node-amqp createConnection options.
     * @param {[type]} clientOptions node-amqp createConnection client options.
     */
    function Connection (options, clientOptions) {
        EventEmitter.call(this);

        this.options = options;
        this.clientOptions = clientOptions;

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

    util.inherits(Connection, EventEmitter);

    /**
     * Starts the Connection
     * @return {Promise}
     */
    Connection.prototype.start = function() {
        var self = this,
            deferred = Q.defer();

        if (this.connection) {
            deferred.reject(new Error('Connection Already Started.'));
        } else {
            // Create a new connection and setup listeners.
            this.connection = new amqp.createConnection(
                this.options,
                this.clientOptions
            );

            this.connection.on('ready', function () {
                self.emit('ready');
            });

            this.connection.on('error', function (error) {
                // Suppress ECONNRESET which is very prevalent on Ubuntu
                // when working with RabbitMQ.
                if (error.code !== 'ECONNRESET') {
                    self.emit('error', error);
                }
            });

            this.connection.on('close', function () {
                self.emit('close');
            });

            // Setup emitters for Connection based on amqp.Connection.
            this.once('ready', function () {
                deferred.resolve();
            });

            this.once('error', function (error) {
                deferred.reject(error);
            });
        }

        return deferred.promise;
    };

    /**
     * Stops the Connection
     * @return {Promise}
     */
    Connection.prototype.stop = function() {
        var self = this,
            deferred = Q.defer();

        if (this.connection) {
            this.once('close', function () {
                delete self.connection;
                deferred.resolve();
            });

            this.connection.disconnect();
        } else {
            deferred.reject(new Error('Connection Not Started.'));
        }

        return deferred.promise;
    };

    /**
     * Proxies to amqp.Connection.exchange
     * @param  {String}   name
     * @param  {Object}   options
     * @return {Promise}
     */
    Connection.prototype.exchange = function(name, options) {
        if (!this.connection) {
            return Q.reject(new Error('Connection Not Established.'));
        }

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

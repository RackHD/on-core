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
        'Util'
    )
);

function connectionFactory (assert, amqp, Q, EventEmitter, util) {
    function Connection (options, serverOptions) {
        EventEmitter.call(this);

        this.options = options;
        this.serverOptions = serverOptions;

        Object.defineProperty(this, 'exchanges', {
            get: function () {
                if (this.connection) {
                    return this.connection.exchanges;
                }
            }
        });
    }

    util.inherits(Connection, EventEmitter);

    Connection.prototype.start = function() {
        var self = this,
            deferred = Q.defer();

        if (this.connection) {
            deferred.reject(new Error('Connection Already Started.'));
        } else {
            // Create a new connection and setup listeners.
            this.connection = new amqp.createConnection(
                this.options,
                this.serverOptions
            );

            this.connection.on('ready', function () {
                self.emit('ready');
            });

            this.connection.on('error', function (error) {
                self.emit('error', error);
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

    Connection.prototype.stop = function() {
        var deferred = Q.defer();

        if (this.connection) {
            this.once('close', function () {
                this.connection.removeAllListeners();
                this.connection = undefined;
                deferred.resolve();
            });

            this.connection.disconnect();
        } else {
            deferred.reject(new Error('Connection Not Started.'));
        }

        return deferred.promise;
    };

    Connection.prototype.exchange = function(name, options, callback) {
        return this.connection.exchange(name, options, callback);
    };

    Connection.prototype.queue = function(name, options, callback) {
        return this.connection.queue(name, options, callback);
    };

    return Connection;
}

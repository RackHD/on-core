// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = loggingProtocolFactory;

di.annotate(loggingProtocolFactory, new di.Provide('Protocol.Logging'));
di.annotate(loggingProtocolFactory,
    new di.Inject(
        'Assert',
        'Constants',
        'Services.Messenger',
        '_',
        'Result',
        'Q'
    )
);

function loggingProtocolFactory (assert, Constants, messenger, _, Result, Q) {
    var levels = _.keys(Constants.Logging.Levels);

    function LoggingProtocol() {
    }

    /**
     * Sends a log message out over the messenger...
     *
     * @param level {string} one of ['emerg','alert','crit','error','warning',
     *                       'notice','info','debug','silly']
     * @param data {Object}
     * @returns {Q.promise} resolving if everything worked, rejecting with
     *                      relevant error if it didn't
     */
    LoggingProtocol.prototype.publishLog = function (level, data) {
        assert.isIn(level, levels);
        assert.object(data, 'data');

        return messenger.publish(
            Constants.Protocol.Exchanges.Logging.Name,
            level,
            new Result({ value: data })
        );
    };

    /**
     * Subscribes to the log feed for the given message level
     *
     * @param level {string} one of ['emerg','alert','crit','error','warning',
     *                       'notice','info','debug','silly']
     * @param callback {function} callback taking a single value - the message
     * @returns {Q.promise} resolving if everything worked, rejecting with
     *                      relevant error if it didn't
     */
    LoggingProtocol.prototype.subscribeLog = function(level, callback) {
        assert.isIn(level, levels);
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Logging.Name,
            level,
            function(data, message) {
                Q.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
            }
        );
    };


    return new LoggingProtocol();
}

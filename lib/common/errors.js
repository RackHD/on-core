// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di'),
    util = require('util');

module.exports = ErrorFactory;

di.annotate(ErrorFactory, new di.Provide('Errors'));

function ErrorFactory() {

    /**
     * Base error object which should be inherited, not used directly.
     * @constructor
     * @param {string} message Error Message
     */
    function BaseError(message) {
        this.message = message;
        this.name = this.constructor.name;

        Error.captureStackTrace(this, BaseError);
    } util.inherits(BaseError, Error);

    // TODO: Add prototype helpers to BaseError below here.

    // TODO: Add prototype helpers to BaseError above here.

    /**
     * Pretend Error as a Proof of Concept.
     * @constructor
     * @param {string} message Error Message
     */
    function MyError(message) {
        BaseError.call(this, message); Error.captureStackTrace(this, MyError);
    } util.inherits(MyError, BaseError);

    return {
        BaseError: BaseError,
        MyError: MyError
    };
}

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
    function BaseError(message, context) {
        this.message = message;
        this.name = this.constructor.name;
        this.context = context || {};

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
        BaseError.call(this, message);
        Error.captureStackTrace(this, MyError);
    } util.inherits(MyError, BaseError);

    function NotFoundError(message, context) {
        BaseError.call(this, message, context);
        Error.captureStackTrace(this, NotFoundError);
        this.status = 404;
    } util.inherits(NotFoundError, BaseError);

    function ValidationError(context) {
        BaseError.call(this, 'Validation Error', context);
        Error.captureStackTrace(this, ValidationError);
    } util.inherits(ValidationError, BaseError);

    function LookupError(message) {
        BaseError.call(this, message);
        Error.captureStackTrace(this, LookupError);
    }
    util.inherits(LookupError, BaseError);

    function SchemaError(context) {
        BaseError.call(this, 'JSON Schema Violation', context);
        Error.captureStackTrace(this, SchemaError);
    }
    util.inherits(SchemaError, BaseError);

    // Helper error to break out of promise chains and differentiate
    // from real errors in the promise chain.
    function BreakPromiseChainError() {
        BaseError.call(this, 'Break Promise Chain', '');
        Error.captureStackTrace(this, BreakPromiseChainError);
    }

    return {
        BaseError: BaseError,
        MyError: MyError,
        NotFoundError: NotFoundError,
        ValidationError: ValidationError,
        LookupError: LookupError,
        SchemaError: SchemaError,
        BreakPromiseChainError: BreakPromiseChainError
    };
}

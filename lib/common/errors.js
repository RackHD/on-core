// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di'),
    util = require('util');

module.exports = ErrorFactory;

di.annotate(ErrorFactory, new di.Provide('Errors'));
di.annotate(ErrorFactory,
    new di.Inject(
        '_'
    )
);

function ErrorFactory(_) {
    /**
     * Provide default serialization for all Error objects.
     */
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            return {
                name: this.name,
                message: this.message,
                stack: this.stack,
                context: _.merge(
                    // Create a default context if none exists.
                    this.context || {},
                    // Copy extra fields into context.
                    _.omit(
                        this,
                        ['stack', 'arguments', 'name', 'message', 'context']
                    )
                )
            };
        },
        configurable: true
    });

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

    return {
        BaseError: BaseError,
        MyError: MyError,
        ValidationError: ValidationError,
        LookupError: LookupError,
        SchemaError: SchemaError
    };
}

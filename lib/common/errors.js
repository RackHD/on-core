// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = ErrorFactory;

ErrorFactory.$provide = 'Errors';
ErrorFactory.$inject = [
    'Util'
];

function ErrorFactory(util) {
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
    }
    util.inherits(BaseError, Error);

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
    }
    util.inherits(MyError, BaseError);

    function BadRequestError(message, context) {
        BaseError.call(this, message, context);
        Error.captureStackTrace(this, BadRequestError);
        this.status = 400;
    }
    util.inherits(BadRequestError, BaseError);

    function NotFoundError(message, context) {
        BaseError.call(this, message, context);
        Error.captureStackTrace(this, NotFoundError);
        this.status = 404;
    }
    util.inherits(NotFoundError, BaseError);

    function RequestTimedOutError(message) {
        BaseError.call(this, message);
        Error.captureStackTrace(this, RequestTimedOutError);
    }
    util.inherits(RequestTimedOutError, BaseError);

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

    function TaskCancellationError(message) {
        BaseError.call(this, message);
        Error.captureStackTrace(this, TaskCancellationError);
    }
    util.inherits(TaskCancellationError, BaseError);

    function TemplateRenderError(message) {
        BaseError.call(this, message);
        Error.captureStackTrace(this, TemplateRenderError);
    }
    util.inherits(TemplateRenderError, BaseError);

    // Helper error to break out of promise chains and differentiate
    // from real errors in the promise chain.
    function BreakPromiseChainError() {
        BaseError.call(this, 'Break Promise Chain');
        Error.captureStackTrace(this, BreakPromiseChainError);
    }
    util.inherits(BreakPromiseChainError, BaseError);

    function JobKilledError(message) {
        BaseError.call(this, message);
        Error.captureStackTrace(this, JobKilledError);
    }
    util.inherits(JobKilledError, BaseError);

    function MaxGraphsRunningError() {
        BaseError.call(this, "Max Graphs Running");
        Error.captureStackTrace(this, MaxGraphsRunningError);
    }
    util.inherits(MaxGraphsRunningError, BaseError);

    return {
        BaseError: BaseError,
        MyError: MyError,
        BadRequestError: BadRequestError,
        NotFoundError: NotFoundError,
        RequestTimedOutError: RequestTimedOutError,
        ValidationError: ValidationError,
        LookupError: LookupError,
        SchemaError: SchemaError,
        TaskCancellationError: TaskCancellationError,
        TemplateRenderError: TemplateRenderError,
        BreakPromiseChainError: BreakPromiseChainError,
        JobKilledError: JobKilledError,
        MaxGraphsRunningError: MaxGraphsRunningError
    };
}

// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = ErrorEventFactory;

di.annotate(ErrorEventFactory, new di.Provide('ErrorEvent'));
di.annotate(ErrorEventFactory,
    new di.Inject(
        'Assert',
        'Serializable'
    )
);

function ErrorEventFactory (assert, Serializable) {
    function ErrorEvent (error) {
        Serializable.call(
            this,
            ErrorEvent.schema,
            // Chai As Promised will instantiate an empty ErrorEvent
            // in checks against error types such as the following:
            //   this.promise.should.be.rejectedWith(ErrorEvent)
            error !== undefined ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
                context: error.context || {}
            } : {}
        );
    }

    ErrorEvent.schema = {
        id: 'ErrorEvent',
        type: 'object',
        properties: {
            name: {
                type: 'string'
            },
            message: {
                type: 'string'
            },
            stack: {
                type: 'string'
            },
            context: {
                type: 'object'
            }
        },
        required: [ 'name', 'message', 'stack', 'context' ]

    };

    Serializable.register(ErrorEventFactory, ErrorEvent);

    return ErrorEvent;
}


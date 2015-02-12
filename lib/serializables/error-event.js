// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di'),
    util = require('util');

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
            {
                name: {
                    type: 'string',
                    required: true
                },
                message: {
                    type: 'string',
                    required: true
                },
                stack: {
                    type: 'string',
                    required: true
                },
                context: {
                    type: 'object',
                    required: true
                }
            },
            {
                name: error.name,
                message: error.message,
                stack: error.stack,
                context: error.context || {}
            }
        );
    }

    util.inherits(ErrorEvent, Serializable);

    Serializable.register(ErrorEventFactory, ErrorEvent);

    return ErrorEvent;
}
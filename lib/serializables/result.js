// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di'),
    util = require('util');

module.exports = ResultFactory;

di.annotate(ResultFactory, new di.Provide('Result'));
di.annotate(ResultFactory,
    new di.Inject(
        'Assert',
        'Serializable'
    )
);

function ResultFactory (assert, Serializable) {
    function Result (defaults) {
        Serializable.call(
            this,
            {
                value: {
                    /* disabled because task and taskRunner protocol methods return undefined */
                    //required: true
                }
            },
            defaults
        );
    }

    util.inherits(Result, Serializable);

    Serializable.register(ResultFactory, Result);

    return Result;
}

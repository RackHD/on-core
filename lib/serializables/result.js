// Copyright (c) 2015, EMC Corporation


'use strict';

var di = require('di');

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
            Result.schema,
            defaults
        );
    }

    Result.schema = {
        id: 'Result',
        type: 'object',
        properties: {
            value: {
                /* disabled because task and taskRunner protocol methods return undefined */
                //required: true
            }
        }
    };

    Serializable.register(ResultFactory, Result);

    return Result;
}


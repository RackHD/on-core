// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = ResultFactory;

ResultFactory.$provide = 'Result';
ResultFactory.$inject = [
    'Assert',
    'Serializable'
];

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


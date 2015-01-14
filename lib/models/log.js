// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = LogModelFactory;

di.annotate(LogModelFactory, new di.Provide('Models.Log'));
di.annotate(LogModelFactory, new di.Inject(
        'Model',
        'Constants',
        '_'
    )
);
function LogModelFactory (Model, constants, _) {
    return Model.extend({
        connection: 'mongo',
        identity: 'logs',
        attributes: {
            module: {
                type: 'string',
                required: false
            },
            level: {
                type: 'string',
                required: true,
                in: _.keys(constants.Logging.Levels)
            },
            message: {
                type: 'string',
                required: true
            },
            context: {
                type: 'json',
                required: false,
                json: true
            },
            trace: {
                type: 'string',
                uuidv4: true,
                required: true
            },
            timestamp: {
                type: 'datetime',
                required: true
            },
            caller: {
                type: 'string',
                required: true
            },
            subject: {
                type: 'string',
                required: true
            }
        }
    });
}

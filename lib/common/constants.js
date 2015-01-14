// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = constantsFactory;

di.annotate(constantsFactory, new di.Provide('Constants'));
di.annotate(constantsFactory,
    new di.Inject(
    )
);

function constantsFactory () {
    var constants = Object.freeze({
        WorkingDirectory: process.cwd(),
        Logging: {
            Colors: {
              emerg: 'red',
              alert: 'yellow',
              crit: 'red',
              error: 'red',
              warning: 'red',
              notice: 'yellow',
              info: 'green',
              debug: 'blue',
              silly: 'rainbow'
            },
            Levels: {
                emerg: 8,
                alert: 7,
                crit: 6,
                error: 5,
                warning: 4,
                notice: 3,
                info: 2,
                debug: 1,
                silly: 0
            },
            Context: {
                Length: 6
            },
            Redactions: ['id', 'mac', 'ip']
        }
    });

    return constants;
}

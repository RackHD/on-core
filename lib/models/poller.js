// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = PollerModelFactory;

di.annotate(PollerModelFactory, new di.Provide('Models.Poller'));
di.annotate(PollerModelFactory, new di.Inject(
        'Model'
    )
);

function PollerModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'pollers'
    });
}
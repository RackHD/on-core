// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var base = require('./base-spec');

describe('Poller Model', function () {
    base.before(function (waterline, context) {
        context.model = waterline.pollers;
        context.attributes = context.model._attributes;
    });

    base.after();

    describe('Base', function () {
        base.examples();
    });
});

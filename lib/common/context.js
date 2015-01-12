// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = ContextFactory;

di.annotate(ContextFactory, new di.Provide('Context'));
di.annotate(ContextFactory,
    new di.Inject(
        'uuid',
        '_'
    )
);

function ContextFactory (uuid, _) {
    function Context (id) {
        this.id = id || uuid.v4();
    }

    Context.prototype.get = function (key, value) {
        return this[key] || value;
    };

    Context.prototype.set = function (key, value) {
        this[key] = value;
        return this;
    };

    Context.prototype.clone = function () {
        return _.omit(_.cloneDeep(this), 'id');
    };

    return Context;
}
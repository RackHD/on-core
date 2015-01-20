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

    Context.prototype.push = function (key, values) {
        this[key] = this[key] || [];

        this[key].push(values);

        return this;
    };

    Context.prototype.pop = function (key) {
        this[key] = this[key] || [];

        return this[key].pop();
    };

    Context.prototype.clone = function () {
        return _.omit(_.cloneDeep(this), 'id');
    };

    return Context;
}

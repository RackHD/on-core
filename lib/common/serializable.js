// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = SerializableFactory;

di.annotate(SerializableFactory, new di.Provide('Serializable'));
di.annotate(SerializableFactory,
    new di.Inject(
        'Assert',
        'Util',
        'Validatable',
        '_'
    )
);

function SerializableFactory (assert, util, Validatable, _) {
    function Serializable(rules, defaults) {
        Validatable.call(this, rules);

        _.defaults(this, defaults);
    }

    util.inherits(Serializable, Validatable);

    Serializable.register = function (factory, constructor) {
        constructor.provides = util.provides(factory);
    };

    return Serializable;
}

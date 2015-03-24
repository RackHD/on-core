// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = SerializableFactory;

di.annotate(SerializableFactory, new di.Provide('Serializable'));
di.annotate(SerializableFactory,
    new di.Inject(
        'Q',
        'Assert',
        'Util',
        'Validatable',
        '_'
    )
);

function SerializableFactory (Q, assert, util, Validatable, _) {
    function Serializable(schema, defaults) {
        Validatable.call(this, schema);

        _.defaults(this, defaults);
    }

    util.inherits(Serializable, Validatable);

    Serializable.register = function (factory, constructor) {
        constructor.provides = util.provides(factory);
    };

    Serializable.prototype.serialize = function (target) {
        target = target || this;

        return Q.resolve()
            .then(function() {
                return _.cloneDeep(target);
            });
    };

    Serializable.prototype.deserialize = function (target) {
        _.defaults(this, target || {});

        return Q.resolve(this);
    };

    return Serializable;
}

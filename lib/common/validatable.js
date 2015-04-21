// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = ValidatableFactory;

di.annotate(ValidatableFactory, new di.Provide('Validatable'));
di.annotate(ValidatableFactory,
    new di.Inject(
        'Q',
        '_',
        'jsonschema',
        'Errors',
        'Assert'
    )
);

function ValidatableFactory (Q, _, jsonschema, Errors, assert) {
    var Validator = jsonschema.Validator;

    function Validatable(schema) {
        assert.object(schema);

        Object.defineProperty(this, 'schema', {
            value: schema,
            enumerable: false
        });
    }

    Validatable.prototype.validate = function (target, schema) {
        target = target || this;

        var validator = new Validator(),
            outcome = validator.validate(target, schema || this.schema);

        if (_.isEmpty(outcome.errors)) {
            return Q.resolve(target);
        } else {
            return Q.reject(new Errors.SchemaError(outcome));
        }
    };

    Validatable.prototype.validatePartial = function (target) {
        target = target || this;

        return this.validate(target, _.omit(this.schema, 'required'));
    };

    Validatable.prototype.validateAsModel = function (target) {
        target = target || this;

        return this.validate(target);
    };

    return Validatable;
}

// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ValidatableFactory;

ValidatableFactory.$provide = 'Validatable';
ValidatableFactory.$inject = [
    'Promise',
    '_',
    'jsonschema',
    'Errors',
    'Assert'
];

function ValidatableFactory (Promise, _, jsonschema, Errors, assert) {
    var Validator = jsonschema.Validator,
        validator = new Validator();

    function Validatable(schema) {
        assert.object(schema);

        Object.defineProperty(this, 'schema', {
            value: schema,
            enumerable: false
        });
    }

    Validatable.register = function (constructor) {
        assert.func(constructor, 'Must be a constructor function.');
        assert.object(constructor.schema, 'Must specify a schema property.');
        assert.string(constructor.schema.id, 'Must specify a schema id.');

        // Add the constructor schema to the available schemas for validation.
        validator.addSchema(constructor.schema, '/%s'.format(constructor.schema.id));
    };

    Validatable.prototype.validate = function (target, schema) {
        target = target || this;

        var outcome = validator.validate(target, schema || this.schema);

        if (_.isEmpty(outcome.errors)) {
            return Promise.resolve(target);
        } else {
            // Wrap with new Error because util.isError checks in swagger
            // fail on our custom errors.
            // Add context errors so the JSON schema violation is visibile to
            // the caller.
            var error = new Error(new Errors.SchemaError(outcome));
            error.violations = outcome.errors;
            return Promise.reject(error);
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

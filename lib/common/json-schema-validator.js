// Copyright 2016, EMC, Inc.

'use strict';

module.exports = jsonSchemaValidatorFactory;

jsonSchemaValidatorFactory.$provide = 'JsonSchemaValidator';
jsonSchemaValidatorFactory.$inject = [
    'Ajv'
];

function jsonSchemaValidatorFactory(
    Ajv
) {
    function JsonSchemaValidator(options) {
        this._ajv = new Ajv(options || {});
        this.addSchema = this._ajv.addSchema;
        this.addMetaSchema = this._ajv.addMetaSchema;
    }

    /**
     * validate JSON data with given JSON schema
     * @param  {Object|String} schema  JSON schema Object or schema ref id
     * @param  {Object} data  JSON data to be validated
     * @return {Boolean} validation pass or throw error
     */
    JsonSchemaValidator.prototype.validate = function (schema, data) {
        if (this._ajv.validate(schema, data)) {
            return true;
        } else {
            var err = new Error('JSON schema validation failed - ' + this._ajv.errorsText());
            err.errorList = this._ajv.errors;
            throw err;
        }
    };

    /**
     * Get compiled schema from the instance by `key` or `ref`.
     * @param  {String} key `key` that was passed to `addSchema` or
     *                  full schema reference (`schema.id` or resolved id).
     * @return {Object} schema
     */
    JsonSchemaValidator.prototype.getSchema = function (key) {
        var schemaCompiled = this._ajv.getSchema(key);
        if (schemaCompiled) {
            return schemaCompiled.schema;
        }
    };

    return JsonSchemaValidator;
}

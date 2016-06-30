// Copyright 2016, EMC, Inc.

'use strict';

module.exports = jsonSchemaValidatorFactory;

jsonSchemaValidatorFactory.$provide = 'JsonSchemaValidator';
jsonSchemaValidatorFactory.$inject = [
    'Ajv',
    '_'
];

function jsonSchemaValidatorFactory(
    Ajv,
    _
) {
    var url = require('url');

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

    /**
     * Get reference resolveed schema by `key`
     * @param  {String} key `key` that was passed to `addSchema` or
     *                  full schema reference (`schema.id` or resolved id).
     * @return {Object} schema with reference resolved
     */
    JsonSchemaValidator.prototype.getSchemaResolved = function (key) {
        var schemaCompiled = this._ajv.getSchema(key);
        if (undefined === schemaCompiled) {
            return;
        }

        if (_.isEmpty(schemaCompiled.refs)) {
            return schemaCompiled.schema;
        }

        var resolvedValues = {};
        resolveRef(schemaCompiled, resolvedValues);
        var schemaResolved = _.cloneDeep(schemaCompiled.schema);
        // replaced is an array will be pushed ref id when there is any $ref object 
        // been replaced repeat replaceRefObj when replace real happened in last time,
        // until all $ref object been replaced. Each replaceRefObj will cover the $ref
        // in the same nest level (depth)
        var replaced;
        do {
            replaced = [];
            replaceRefObj(schemaResolved, resolvedValues, schemaResolved.id, replaced);
        }
        while (replaced.length > 0);

        return schemaResolved;

        // resolve reference recursively
        // it search the compiled schema data structure from ajv.getSchema, find out 
        // and store referenced value to resolvedValues map
        function resolveRef(schemaObj, resolvedValues) {
            // the array store referenced value
            var refVal = schemaObj.refVal;
            // the map store full ref id and index of the referenced value in refVal
            // example: { 'test#definitions/option' : 1, 'test#definitions/repo' : 2 }
            var refs = schemaObj.refs;
            // the map to store schema value with sub reference
            var subRefs = {};

            _.forEach(refs, function (index, refId) {
                // if reference id already resolved then continue the loop
                if (refId in resolvedValues) {
                    return true; // continue
                }

                var refValue = refVal[index];
                // if no further nested reference, add to resolved map
                if (_.isEmpty(refValue.refs)) {
                    resolvedValues[refId] = refValue;
                    return true;
                }

                // add schema value with sub reference to map to resolve later
                subRefs[refId] = refValue;
            });

            // resolve sub reference recursively
            _.forEach(subRefs, function (subRef, refId) {
                resolvedValues[refId] = 1;
                resolvedValues[refId] = resolveRef(subRef, resolvedValues);
            });

            return schemaObj.schema;
        }

        // replace reference in schema recursively
        // it search the schema object and replace the $ref object with the real value
        // example: { $ref: '#/definitions/test'} -> { type: 'string', format: 'uri'}
        function replaceRefObj (obj, resolvedValues, baseId, replaced) {
            if (!(obj instanceof Object)) {
                return;
            }

            if (obj.$ref) {
                var refId = url.resolve(baseId, obj.$ref);
                if (refId in resolvedValues) {
                    replaced.push(refId);
                    return resolvedValues[refId];
                }
            }

            for (var k in obj) {
                var resolvedObj = replaceRefObj(obj[k], resolvedValues, baseId, replaced);
                if (resolvedObj) {
                    obj[k] = resolvedObj;
                }
            }
        }
    };

    return JsonSchemaValidator;
}

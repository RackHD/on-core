// Copyright 2016, EMC, Inc.

'use strict';

module.exports = jsonSchemaValidatorFactory;

jsonSchemaValidatorFactory.$provide = 'JsonSchemaValidator';
jsonSchemaValidatorFactory.$inject = [
    'Ajv',
    'Assert',
    'Errors',
    'fs',
    'path',
    'Promise',
    '_'
];

function jsonSchemaValidatorFactory(
    Ajv,
    assert,
    Errors,
    nodeFs,
    path,
    Promise,
    _
) {
    var url = require('url');
    var fs = Promise.promisifyAll(nodeFs);

    function JsonSchemaValidator(options) {
        this.options = options || {};
        this.nameSpace = options.nameSpace || '';
        this._ajv = new Ajv(this.options);
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
     * validate JSON data with given JSON schema and ignore some failure if the error matches some
     * patterns.
     *
     * NOTE: this function depends on the option 'allErrors` and 'verbose' is enabled
     *
     * @param  {Object|String} schema - JSON schema Object or schema ref id
     * @param  {Object} data - JSON data to be validated
     * @param  {Regex|Array<Regex>} skipPatterns - The skip patterns, if any skip pattern is
     * matched, that validation error will be ignored.
     * @return {Boolean} true if validation passes, otherwise throw error
     */
    JsonSchemaValidator.prototype.validatePatternsSkipped = function (schema, data, skipPatterns) {
        assert.equal(this.options.allErrors, true,
                  "option 'allErrors' need be enabled for validatePatternSkipped");
        assert.equal(this.options.verbose, true,
                 "option 'verbose' need be enabled for validatePatternSkipped");

        if (this._ajv.validate(schema, data)) {
            return true;
        }

        var errors = this._ajv.errors;

        if (skipPatterns) {
            if (!_.isArray(skipPatterns)) {
                skipPatterns = [skipPatterns];
            }
            assert.arrayOfRegexp(skipPatterns, 'skip pattern should be regexp');

            //If any skip patter is matched, then that error will be skipped.
            errors = _.filter(errors, function(error) {
                return !_.some(skipPatterns, function(pattern) {
                    var result = pattern.test(error.data + '');
                    return result;
                });
            });
        }

        if (_.isEmpty(errors)) {
            return true;
        } else {
            var err = new Error('JSON schema validation failed - ' + this._ajv.errorsText(errors));
            err.errorList = errors;
            throw err;
        }
    };

    /**
     * Add schema to the instance.
     * @param {Object} schema
     * @param {String} [name] - Optional schema name when schema has an id
     */
    JsonSchemaValidator.prototype.addSchema = function (schema, name) {
        assert.equal(_.isEmpty(name) && _.isEmpty(schema.id), false,
                '`name` should not be empty, or `schema` should has an `id` property');

        schema.id = url.resolve(this.nameSpace, name || schema.id);
        return this._ajv.addSchema(schema);
    };

    /**
     * Add array of schemas to the instance.
     * @param {Array<Object>} schemas - array of schema
     */
    JsonSchemaValidator.prototype.addSchemas = function (schemas) {
        assert.arrayOfObject(schemas,
                '`schemas` should be an array of JSON schema');
        var self = this;
        _.forEach(schemas, function (schema) {
            self.addSchema(schema);
        });
    };

    /**
     * Add all schema in the folder to the instance.
     * @param {String} schemaDir - the directory where schema files in
     * @param {String} [metaSchemaName] - Optional the meta schema name
     * @return {Promise}
     */
    JsonSchemaValidator.prototype.addSchemasByDir = function (schemaDir, metaSchemaName) {
        var self = this;
        return Promise.try(function () {
            assert.string(schemaDir, 'schemaDir');
            if (metaSchemaName) {
                assert.string(metaSchemaName, 'metaSchemaName');
            }
        })
        .then(function () {
            return fs.readdirAsync(schemaDir);
        })
        .filter(function (fileName) {
            return /\.json$/i.test(fileName);
        })
        .reduce(function (entries, fileName) {
            return fs.readFileAsync(path.resolve(schemaDir, fileName))
            .then(function (fileData) {
                var content = JSON.parse(fileData);
                content.id = fileName;
                entries[fileName] = content;
                return entries;
            });
        }, {})
        .then(function (entries) {
            //meta schema should be added first, so subsequent schemas can be validated againist it
            if (metaSchemaName) {
                var metaSchema = entries[metaSchemaName];
                if (!metaSchema) {
                    throw new Error('Cannot find the meta schema "' + metaSchemaName +
                        '" in directory "' + schemaDir + '"');
                }
                self.addMetaSchema(metaSchema);
                delete entries[metaSchemaName];
            }
            return entries;
        })
        .then(function (entries) {
            self.addSchemas(_.values(entries));
        });
    };

    /**
     * Get all schema names from the instance.
     * @param {Object} [option] - namespace will not be included by default,
     *      set { includeNameSpace: true } when need to include namespace.
     * @return {Array<String>} schemaNames
     */
    JsonSchemaValidator.prototype.getAllSchemaNames = function (option) {
        var self = this;
        return _(self._ajv._schemas).keys()
        .filter(function (name) {
            // filter out the default json-schema.org metaSchema
            return  !/^http:\/\/json-schema.org/.test(name);
        })
        .map(function (name) {
            return option && option.includeNameSpace ? name : path.basename(name);
        })
        .value();
    };

    /**
     * Get schema from the instance by name.
     * @param  {String} name schema name or id
     * @return {Object} schema
     */
    JsonSchemaValidator.prototype.getSchema = function (name) {
        var key = url.resolve(this.nameSpace, name);
        var schemaCompiled = this._ajv.getSchema(key);
        if (schemaCompiled) {
            return schemaCompiled.schema;
        }
    };

    /**
     * Get reference resolved schema by name.
     * @param  {String} name schema name or id
     * @return {Object} schema with reference resolved
     */
    JsonSchemaValidator.prototype.getSchemaResolved = function (name) {
        var key = url.resolve(this.nameSpace, name);
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
        // replaced is a map will be set refId as when there is any $ref object 
        // been replaced. repeat replaceRefObj when replace real happened in last call,
        // until all $ref object been replaced. Each replaceRefObj will cover the $ref
        // in the same nest level (depth)
        var replaced = {};
        replaceRefObj(schemaResolved, resolvedValues, schemaResolved.id, replaced);

        while (_.size(replaced) > 0) {
            var replacedLastLoop = replaced;
            replaced = {};
            _.forOwn(replacedLastLoop, function (refValue, refId) { //jshint ignore: line
                replaceRefObj(refValue, resolvedValues, refId, replaced);
            });
        }

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
            // if found $ref key, other properties of the obj will be ignored
            if (obj.$ref) {
                var refId = url.resolve(baseId, obj.$ref);
                if (refId in resolvedValues) {
                    replaced[refId] = resolvedValues[refId];
                    return resolvedValues[refId];
                }
            }

            _.forOwn(obj, function(val, k) {
                if (!(val instanceof Object)) {
                    return true; //continue
                }

                var resolvedObj = replaceRefObj(val, resolvedValues, baseId, replaced);
                if (resolvedObj) {
                    obj[k] = resolvedObj;
                }
            });
        }
    };

    /**
     * Reset JSON-Schema validator
     * After reset, all added schemas and meta-schemas will be deleted.
     */
    JsonSchemaValidator.prototype.reset = function () {
        this._ajv = new Ajv(this.options);
    };

    return JsonSchemaValidator;
}

// Copyright 2016, EMC, Inc.

'use strict';

describe('JsonSchemaValidator', function () {
    var validator;
    var JsonSchemaValidator;
    var testSchema1 = { 
        properties: {
            repo: {
                type: 'string',
                format: 'uri'
            }
        }
    };

    var testRefSchema1 = {
        id: '/refschema/r1',
        definitions: {
            url: {
                type: 'string',
                format: 'uri'
            }
        },
        properties: {
            repo: {
                $ref: '#/definitions/url'
            },
            index: {
                type: 'number',
            }
        }
    };

    var testRefSchema2 = {
        id: '/refschema/r2',
        properties: {
            repo: {
                $ref:'/refschema/r1#/definitions/url'
            }
        }
    };

    helper.before();

    before(function() {
        JsonSchemaValidator = helper.injector.get('JsonSchemaValidator');
    });

    beforeEach(function() {
        validator = new JsonSchemaValidator({allErrors: true, verbose: true});
    });

    helper.after();

    it('should return true when validation pass', function () {
        var result = validator.validate(testSchema1, { repo : '/172.31.128.1/mirrors' });
        expect(result).to.be.true;
    });

    it('should throw validation error with incorrect data format', function () {
        expect(function () {
            validator.validate(testSchema1, { repo : 'abc' });
        }).to.throw(/JSON schema validation failed/);
    });

    it('should add correct schema', function () {
        expect(validator.addSchema(testSchema1, 'test1')).to.be.empty;
        expect(validator.addSchema(testRefSchema1)).to.be.empty;
        expect(validator.addSchema(testRefSchema2)).to.be.empty;
    });

    it('should throw error when add duplicated key', function () {
        validator.addSchema(testSchema1, 'test1');
        expect(function () {
            validator.addSchema(testSchema1, 'test1');
        }).to.throw(/schema with key or id "test1" already exists/);
    });

    it('should get existing schema', function () {
        validator.addSchema(testSchema1, 'test1');
        expect(validator.getSchema('test1')).to.deep.equal(testSchema1);
    });

    it('should not find not existing schema', function () {
        expect(validator.getSchema('test2')).to.be.undefined;
    });

    it('should throw error when reference schema not added', function () {
        validator.addSchema(testRefSchema2);
        expect(function () {
            validator.getSchema('/refschema/r2');
        }).to.throw(/can't resolve reference /);
    });
});


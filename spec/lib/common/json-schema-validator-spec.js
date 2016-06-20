// Copyright 2016, EMC, Inc.

'use strict';

describe('JsonSchemaValidator', function () {
    var validator;
    var testSchema1 = { 
        properties: {
            repo: {
                type: 'string',
                format: 'uri'
            }
        }
    };

    helper.before();

    before(function() {
        var JsonSchemaValidator = helper.injector.get('JsonSchemaValidator');
        validator = new JsonSchemaValidator();
    });

    it('should return true when validation pass', function () {
        var result = validator.validate(testSchema1, { repo : '/172.31.128.1/mirrors' });
        expect(result).to.be.true;
    });

    it('should throw validation error with incorrect data format', function () {
        expect(function () {
            validator.validate(testSchema1, { repo : 'abc' });
        }).to.throw(/JSON schema validtion failed/);
    });

    it('should add correct schema', function () {
        testSchema1.id = 'test1';
        expect(validator.addSchema(testSchema1)).to.be.empty;
    });

    it('should get existing schema', function () {
        expect(validator.getSchema('test1')).to.deep.equal(testSchema1);
    });

    it('should not find schema not exist', function () {
        expect(validator.getSchema('test2')).to.be.undefined;
    });
});


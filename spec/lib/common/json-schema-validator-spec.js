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

    var testRefSchema1Resolved = {
        id: '/refschema/r1',
        definitions: {
            url: {
                type: 'string',
                format: 'uri'
            }
        },
        properties: {
            repo: {
                type: 'string',
                format: 'uri'
            },
            index: {
                type: 'number',
            }
        }
    };

    var testRefSchema2Resolved = {
        id: '/refschema/r2',
        properties: {
            repo: {
                type: 'string',
                format: 'uri'
            }
        }
    };

    var testRefSchema3 = {
        "id": "/refschema/r3",
        "definitions": {
            "UserName": {
                "description": "The user account name",
                "type": "string",
                "pattern": "^[A-Za-z0-9_]",
                "minLength": 1
            },
            "UserPassword": {
                "description": "The account password",
                "type": "string",
                "minLength": 5
            },
            "SshKey": {
                "type": "string",
                "description": "The trusted ssh key for the particular user",
                "minLength": 1
            },
            "UserID": {
                "description": "The unique user identifier for this user account",
                "type": "integer",
                "minimum": 500,
                "maximum": 65535
            },
            "UserAccountInfoSimple": {
                "type": "object",
                "description": "The simple information for an user account",
                "properties": {
                    "name": {
                        "$ref": "#/definitions/UserName"
                    },
                    "password": {
                        "$ref": "#/definitions/UserPassword"
                    },
                    "sshKey": {
                        "$ref": "#/definitions/SshKey"
                    }
                },
                "required": ["name", "password"]
            }
        },
        "properties": {
            "UsersSimple": {
                "description": "The list of user account created during OS installation",
                "type": "array",
                "minItems": 1,
                "items": {
                    "$ref": "#/definitions/UserAccountInfoSimple"
                },
                "uniqueItems": true
            }
        }
    };

    var testRefSchema3Resolved = {
        "id": "/refschema/r3",
        "definitions": {
            "UserName": {
                "description": "The user account name",
                "type": "string",
                "pattern": "^[A-Za-z0-9_]",
                "minLength": 1
            },
            "UserPassword": {
                "description": "The account password",
                "type": "string",
                "minLength": 5
            },
            "SshKey": {
                "type": "string",
                "description": "The trusted ssh key for the particular user",
                "minLength": 1
            },
            "UserID": {
                "description": "The unique user identifier for this user account",
                "type": "integer",
                "minimum": 500,
                "maximum": 65535
            },
            "UserAccountInfoSimple": {
                "type": "object",
                "description": "The simple information for an user account",
                "properties": {
                    "name": {
                        "description": "The user account name",
                        "type": "string",
                        "pattern": "^[A-Za-z0-9_]",
                        "minLength": 1
                    },
                    "password": {
                        "description": "The account password",
                        "type": "string",
                        "minLength": 5
                    },
                    "sshKey": {
                        "type": "string",
                        "description": "The trusted ssh key for the particular user",
                        "minLength": 1
                    }
                },
                "required": ["name", "password"]
            }
        },
        "properties": {
            "UsersSimple": {
                "description": "The list of user account created during OS installation",
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "description": "The simple information for an user account",
                    "properties": {
                        "name": {
                            "description": "The user account name",
                            "type": "string",
                            "pattern": "^[A-Za-z0-9_]",
                            "minLength": 1
                        },
                        "password": {
                            "description": "The account password",
                            "type": "string",
                            "minLength": 5
                        },
                        "sshKey": {
                            "type": "string",
                            "description": "The trusted ssh key for the particular user",
                            "minLength": 1
                        }
                    },
                    "required": ["name", "password"]
                },
                "uniqueItems": true
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

    describe('validate', function() {
        it('should return true when validation pass', function () {
            var result = validator.validate(testSchema1, { repo : '/172.31.128.1/mirrors' });
            expect(result).to.be.true;
        });

        it('should throw validation error with incorrect data format', function () {
            expect(function () {
                validator.validate(testSchema1, { repo : 'abc' });
            }).to.throw(/JSON schema validation failed/);
        });
    });

    describe('addSchema' , function () {
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
    });

    describe('getSchema' , function () {
        it('should get existing schema', function () {
            validator.addSchema(testSchema1, 'test1');
            expect(validator.getSchema('test1')).to.deep.equal(testSchema1);
        });

        it('should not find not existing schema', function () {
            expect(validator.getSchema('test2')).to.be.undefined;
        });

        it('should throw error when referenced schema not added', function () {
            validator.addSchema(testRefSchema2);
            expect(function () {
                validator.getSchema('/refschema/r2');
            }).to.throw(/can't resolve reference /);
        });
    });

    describe('getSchemaResolved' , function () {
        it('should get schema with reference resolved', function () {
            validator.addSchema(testRefSchema1);
            validator.addSchema(testRefSchema2);
            validator.addSchema(testRefSchema3);

            expect(validator.getSchemaResolved('/refschema/r1'))
                .to.deep.equal(testRefSchema1Resolved);
            expect(validator.getSchemaResolved('/refschema/r2'))
                .to.deep.equal(testRefSchema2Resolved);
            expect(validator.getSchemaResolved('/refschema/r3'))
                .to.deep.equal(testRefSchema3Resolved);
        });

        it('should also get schema with no $ref', function () {
            validator.addSchema(testSchema1, 'test1');
            expect(validator.getSchemaResolved('test1')).to.deep.equal(testSchema1);
        });

        it('should not find not existing schema', function () {
            expect(validator.getSchemaResolved('test2')).to.be.undefined;
        });
    });

    describe('validatePatternsSkipped', function() {
        var skipPatterns = [ /\{\{\s*foo.\w+\s*\}\}/, /<%\s*bar.\d+\s*%>/ ];

        it('should return true when validation pass if no skip patterns', function() {
            expect( validator.validatePatternsSkipped(
                testSchema1,
                { repo: '/172.31.128.1/mirrors'}
            )).to.be.true;
        });

        it('should throw error when validation fails if no skip patterns', function() {
            expect( function() {
                validator.validatePatternsSkipped(
                    testSchema1,
                    { repo: 123 }
                );
            }).to.throw(/JSON schema validation failed/);
        });

        it('should return true if the error matches any of skip patterns', function() {
            expect( validator.validatePatternsSkipped(
                testSchema1,
                { repo: '{{ foo.abc}}' },
                skipPatterns
            )).to.be.true;

            expect( validator.validatePatternsSkipped(
                testSchema1,
                { repo: '<%bar.2%>' },
                skipPatterns
            )).to.be.true;
        });

        it('should support the skip pattern if it is not array', function() {
            expect( validator.validatePatternsSkipped(
                testSchema1,
                { repo: '{{ foo.abc}}' },
                skipPatterns[0]
            )).to.be.true;

            expect( validator.validatePatternsSkipped(
                testSchema1,
                { repo: '<%bar.2%>' },
                skipPatterns[1]
            )).to.be.true;
        });

        it('should throw error if not match any of skip patterns', function() {
            expect(function () {
                validator.validatePatternsSkipped(
                    testSchema1,
                    { repo: '{{ test.abc}}' },
                    skipPatterns
                );
            }).to.throw(/JSON schema validation failed/);
        });

        it('should fail if the allErrors option is not enabled', function() {
            validator = new JsonSchemaValidator({allErrors: false, verbose: true});
            expect(function () {
                validator.validatePatternsSkipped(
                    testSchema1,
                    { repo: '{{ foo.abc}}' },
                    skipPatterns
                );
            }).to.throw(/allErrors/);
        });

        it('should fail if the verbose option is not enabled', function() {
            validator = new JsonSchemaValidator({allErrors: true, verbose: false});
            expect(function () {
                validator.validatePatternsSkipped(
                    testSchema1,
                    { repo: '{{ foo.abc}}' },
                    skipPatterns
                );
            }).to.throw(/verbose/);
        });

        it('should fail if the allErrors option is missing', function() {
            validator = new JsonSchemaValidator({verbose: true});
            expect(function () {
                validator.validatePatternsSkipped(
                    testSchema1,
                    { repo: '{{ foo.abc}}' },
                    skipPatterns
                );
            }).to.throw(/allErrors/);
        });

        it('should fail if the verbose option is missing', function() {
            validator = new JsonSchemaValidator({allErrors: true});
            expect(function () {
                validator.validatePatternsSkipped(
                    testSchema1,
                    { repo: '{{ foo.abc}}' },
                    skipPatterns
                );
            }).to.throw(/verbose/);
        });

        it('should throw error is skip pattern is not regex', function() {
            expect(function () {
                validator.validatePatternsSkipped(
                    testSchema1,
                    { repo: 123 },
                    123
                );
            }).to.throw(/regexp/);
        });
    });

    describe('reset', function() {
        it('should have a reset function', function() {
            expect(validator.reset).is.a('function').with.length(0);
        });

        it('should clear validator state after reset', function() {
            validator.addSchema(testSchema1, 'testid');
            expect(validator.getSchema('testid')).to.deep.equal(testSchema1);
            validator.reset();
            expect(validator.getSchema('testid')).to.be.undefined;
        });
    });
});


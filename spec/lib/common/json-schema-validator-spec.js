// Copyright 2016, EMC, Inc.

'use strict';

describe('JsonSchemaValidator', function () {
    var validator;
    var JsonSchemaValidator;
    var ns = 'http://test.rackhd.org';
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
                type: 'number'
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
        id: ns + '/refschema/r1',
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
                type: 'number'
            }
        }
    };

    var testRefSchema2Resolved = {
        id: ns + '/refschema/r2',
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
        "id": ns + "/refschema/r3",
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

    var testRefSchema4 = {
        $schema: 'testMetaSchema.json',
        test: 'test metaSchema required property',
        properties: {
            repo: {
                $ref: 'testRefSchema1.json#/definitions/url'
            }
        }
    };

    var testMetaSchema = {
        allOf: [
            {
                $ref: 'http://json-schema.org/draft-04/schema'
            }
        ],
        properties: {
            test: {
                type: 'string'
            }
        },
        required: ['test']
    };

    helper.before();

    before(function() {
        JsonSchemaValidator = helper.injector.get('JsonSchemaValidator');
    });

    beforeEach(function() {
        validator = new JsonSchemaValidator({allErrors: true, verbose: true, nameSpace: ns });
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

        it('should throw assertion error when no name or id passed', function () {
            expect(function () {
                delete testSchema1.id;
                validator.addSchema(testSchema1);
            }).to.throw(/`name` should not be empty, or `schema` should has an `id` property/);
        });

        it('should throw error when add duplicated key', function () {
            validator.addSchema(testSchema1, 'test1');
            expect(function () {
                validator.addSchema(testSchema1, 'test1');
            }).to.throw(/schema with key or id ".*\/test1" already exists/);
        });
    });

    describe('addSchemas' , function () {
        it('should add correct schema', function () {
            expect(validator.addSchemas([testRefSchema1, testRefSchema2])).to.be.empty;
        });

        it('should throw assertion error incorrect schema param passed', function () {
            expect(function () {
                validator.addSchemas();
            }).to.throw(/`schemas` should be an array of JSON schema/);
            expect(function () {
                validator.addSchemas({});
            }).to.throw(/`schemas` should be an array of JSON schema/);
            expect(function () {
                validator.addSchemas([1,2,3]);
            }).to.throw(/`schemas` should be an array of JSON schema/);
        });
    });

    describe('addSchemasByDir' , function () {
        var nodeFs;
        before(function () {
            nodeFs = helper.injector.get('fs');
            sinon.stub(nodeFs, 'readdirAsync');
            sinon.stub(nodeFs, 'readFileAsync');
        });

        beforeEach(function () {
            nodeFs.readdirAsync.reset();
            nodeFs.readFileAsync.reset();
        });

        it('should add correct schema by directory', function () {
            nodeFs.readdirAsync.resolves([
                'testSchema1.json',
                'nosense',
                'testRefSchema1.json',
                'testRefSchema4.json',
                'testMetaSchema.json'
            ]);
            nodeFs.readFileAsync.onCall(0).resolves(JSON.stringify(testSchema1));
            nodeFs.readFileAsync.onCall(1).resolves(JSON.stringify(testRefSchema1));
            nodeFs.readFileAsync.onCall(2).resolves(JSON.stringify(testRefSchema4));
            nodeFs.readFileAsync.onCall(3).resolves(JSON.stringify(testMetaSchema));

            return validator.addSchemasByDir('/testdir', 'testMetaSchema.json')
            .then(function () {
                expect(nodeFs.readdirAsync).to.be.calledOnce;
                expect(nodeFs.readFileAsync).to.have.callCount(4);
                expect(validator.getSchema('testSchema1.json')).to.have.property('id')
                    .that.equals(ns + '/testSchema1.json');
                expect(validator.getSchema('testRefSchema1.json')).to.have.property('id')
                    .that.equals(ns + '/testRefSchema1.json');
                expect(validator.getSchema('testRefSchema4.json')).to.have.property('id')
                    .that.equals(ns + '/testRefSchema4.json');
            });
        });

        it('should throw not found error when metaSchema not found', function (done) {
            nodeFs.readdirAsync
            .resolves(['testSchema1.json', 'testRefSchema1.json']);
            nodeFs.readFileAsync.onCall(0).resolves(JSON.stringify(testSchema1));
            nodeFs.readFileAsync.onCall(1).resolves(JSON.stringify(testRefSchema1));

            return validator.addSchemasByDir('/testdir', 'noMetaSchema.json')
            .then(function () {
                done(new Error("Expect addSchemasByDir to fail"));
            })
            .catch(function (e) {
                try {
                    expect(e).to.have.property('message').that.equals(
                        'Cannot find the meta schema "noMetaSchema.json" in directory "/testdir"');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });

        it('should throw assertion error when incorrect schemaDir passed', function (done) {
            return validator.addSchemasByDir(123)
            .then(function () {
                done(new Error("Expect addSchemasByDir to fail"));
            })
            .catch(function (e) {
                try {
                    expect(e).to.have.property('message')
                        .that.equals('schemaDir (string) is required');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });

        it('should throw assertion error when incorrect metaSchemaName passed', function (done) {
            return validator.addSchemasByDir('testdir3', 456)
            .then(function () {
                done(new Error("Expect addSchemasByDir to fail"));
            })
            .catch(function (e) {
                try {
                    expect(e).to.have.property('message')
                        .that.equals('metaSchemaName (string) is required');
                    done();
                }
                catch (e) {
                    done(e);
                }
            });
        });

        after(function () {
            nodeFs.readdirAsync.restore();
            nodeFs.readFileAsync.restore();
        });
    });

    describe('getAllSchemaNames' , function () {
        it('should list existing schema names', function () {
            validator.addSchemas([testRefSchema1, testRefSchema3]);
            expect(validator.getAllSchemaNames()).to.deep.equal(['r1', 'r3']);
        });

        it('should list existing schema names with namespace', function () {
            validator.addSchemas([testRefSchema2, testRefSchema3]);
            expect(validator.getAllSchemaNames({ includeNameSpace: true }))
            .to.deep.equal([testRefSchema2Resolved.id, testRefSchema3Resolved.id]);
        });

        it('should not find any schema name when no schema added', function () {
            expect(validator.getAllSchemaNames()).to.be.an('Array').with.length(0);
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


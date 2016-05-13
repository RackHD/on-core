// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');
var  sandbox = sinon.sandbox.create();

describe('Models.Sku', function () {
    helper.before(function (context) {
        context.MessengerServices = function() {
            this.start= sandbox.stub().resolves();
            this.stop = sandbox.stub().resolves();
            this.publish = sandbox.stub().resolves();
        };
        return [
            helper.di.simpleWrapper(context.MessengerServices, 'Messenger')
        ];
    });

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').skus;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('name', function () {
            before(function () {
                this.subject = this.attributes.name;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('rules', function () {
            before(function () {
                this.subject = this.attributes.rules;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
            });
        });

        describe('discoveryGraphName', function () {
            before(function () {
                this.subject = this.attributes.discoveryGraphName;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });
        });

        describe('discoveryGraphOptions', function () {
            before(function () {
                this.subject = this.attributes.discoveryGraphOptions;
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
            });
        });

        describe('httpStaticRoot', function () {
            before(function () {
                this.subject = this.attributes.httpStaticRoot;
            });

            it('should be string', function () {
                expect(this.subject.type).to.equal('string');
            });
        });

        describe('httpTemplateRoot', function () {
            before(function () {
                this.subject = this.attributes.httpTemplateRoot;
            });

            it('should be string', function () {
                expect(this.subject.type).to.equal('string');
            });
        });

        describe('httpProfileRoot', function () {
            before(function () {
                this.subject = this.attributes.httpProfileRoot;
            });

            it('should be string', function () {
                expect(this.subject.type).to.equal('string');
            });
        });

        describe('workflowRoot', function () {
            before(function () {
                this.subject = this.attributes.workflowRoot;
            });

            it('should be string', function () {
                expect(this.subject.type).to.equal('string');
            });
        });

        describe('taskRoot', function () {
            before(function () {
                this.subject = this.attributes.taskRoot;
            });

            it('should be string', function () {
                expect(this.subject.type).to.equal('string');
            });
        });

        describe('skuConfig', function () {
            before(function () {
                this.subject = this.attributes.skuConfig;
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
            });
        });

        describe('version', function () {
            before(function () {
                this.subject = this.attributes.version;
            });

            it('should be string', function () {
                expect(this.subject.type).to.equal('string');
            });
        });

        describe('description', function () {
            before(function () {
                this.subject = this.attributes.description;
            });

            it('should be string', function () {
                expect(this.subject.type).to.equal('string');
            });
        });

    });

    describe('SKU Rules', function () {
        beforeEach(function () {
            return helper.reset();
        });

        it('should validate SKU with rules', function () {
            return this.model.create({
                name: 'test1',
                rules: [
                    {
                        path: 'dmi.memory.total',
                        equals: '32946864kB'
                    }
                ]
            }).should.be.fulfilled;
        });

        it('should not validate SKU rules with invalid values', function () {
            return this.model.create({
                name: 'test2',
                rules: [1, 2, 3]
            }).should.be.rejectedWith(Error);
        });

        it('should not validate SKU rules with a missing path', function () {
            return this.model.create({
                name: 'test3',
                rules: [
                    {
                        path: null,
                    }
                ]
            }).should.be.rejectedWith(Error);
        });

        it('should not validate SKU rules with an invalid validation rule', function () {
            return this.model.create({
                name: 'test4',
                rules: [
                    {
                        path: 'dmi.memory.free',
                        badMatcher: 'asdf'
                    }
                ]
            }).should.be.rejectedWith(Error);
        });
    });
});

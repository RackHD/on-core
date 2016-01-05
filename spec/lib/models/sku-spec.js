// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');

describe('Models.Sku', function () {
    helper.before();

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

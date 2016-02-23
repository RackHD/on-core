// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');
var  sandbox = sinon.sandbox.create();

describe('Models.Tag', function () {
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
        context.model = helper.injector.get('Services.Waterline').tags;
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

    });

    describe('Tag Rules', function () {
        beforeEach(function () {
            return helper.reset();
        });

        it('should validate tag with rules', function () {
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

        it('should not validate tag rules with invalid values', function () {
            return this.model.create({
                name: 'test2',
                rules: [1, 2, 3]
            }).should.be.rejectedWith(Error);
        });

        it('should not validate tag rules with a missing path', function () {
            return this.model.create({
                name: 'test3',
                rules: [
                    {
                        path: null,
                    }
                ]
            }).should.be.rejectedWith(Error);
        });

        it('should not validate tag rules with an invalid validation rule', function () {
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

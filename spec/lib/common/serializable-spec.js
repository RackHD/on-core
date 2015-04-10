// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

var di = require('di'),
    util = require('util');

describe('Serializable', function () {
    var Serializable,
        Validatable,
        Target;

    helper.before();

    before(function () {
        Serializable = helper.injector.get('Serializable');
        Validatable = helper.injector.get('Validatable');

        di.annotate(factory, new di.Provide('Test.FactoryObject'));

        function factory () {
            function FactoryObject (defaults) {
                Serializable.call(
                    this,

                    // Schema
                    {
                        id: '/FactoryObject',
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string'
                            }
                        }
                    },

                    // Default Values
                    defaults
                );
            }

            util.inherits(FactoryObject, Serializable);

            Serializable.register(factory, FactoryObject);

            return FactoryObject;
        }

        // SHort circuiting the injector to simplify things.
        Target = factory();
    });

    helper.after();

    describe('register', function () {
        it('should set constructor.provides to the factory provides', function () {
            Target.provides.should.equal('Test.FactoryObject');
        });
    });

    describe('validatable', function () {
        it('should be validatable', function () {
            var subject = new Target();

            return subject.should.be.an.instanceof(Validatable);
        });

        it('should resolve on success', function () {
            var subject = new Target({ name: 'target' });

            return subject.validate().should.be.fulfilled;
        });

        it('should reject on failure', function () {
            var subject = new Target({ name: 123 });

            return subject.validate().should.be.rejected;
        });
    });

    describe('defaults', function () {
        before(function () {
            this.subject = new Target({
                one: 1,
                two: 2,
                // Not actually allowed
                rules: 'overriden'
            });
        });

        it('should assign default values', function () {
            this.subject.one.should.equal(1);
            this.subject.two.should.equal(2);
        });

        it('should not overwrite existing values', function () {
            this.subject.rules.should.not.equal('overridden');
        });
    });

    describe('serialize', function () {
        before(function () {
            this.subject = new Target({
                one: 1
            });
        });

        it('should use the base serialize method', function() {
            return this.subject.serialize().should.eventually.have.property('one').that.equals(1);
        });
    });

    describe('deserialize', function () {
        it('should use the base deserialize method', function() {
            this.subject = new Target();

            return this.subject.deserialize({
                one: 1
            }).should.eventually.have.property('one').that.equals(1);
        });
    });
});

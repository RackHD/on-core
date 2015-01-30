// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var base = require('./base-spec');

describe('Task Model', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').taskdefinitions;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('friendlyName', function () {
            before(function () {
                this.subject = this.attributes.friendlyName;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('injectableName', function () {
            before(function () {
                this.subject = this.attributes.injectableName;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('implementsTask', function () {
            before(function () {
                this.subject = this.attributes.implementsTask;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should validate with a callback', function() {
                expect(this.subject.in).to.be.a.function;
            });
        });

        describe('options', function () {
            before(function () {
                this.subject = this.attributes.options;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
            });
        });

        describe('properties', function () {
            before(function () {
                this.subject = this.attributes.properties;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
            });
        });
    });
});

// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var base = require('./base-spec');

describe('Sku Model', function () {
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
});


// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var Q = require('q');
var base = require('./base-spec');

describe('Catalog Model', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').catalogs;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('node', function () {
            before(function () {
                this.subject = this.attributes.node;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be a relation to the nodes model', function () {
                expect(this.subject.model).to.equal('nodes');
            });
        });

        describe('source', function () {
            before(function () {
                this.subject = this.attributes.source;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('data', function () {
            before(function () {
                this.subject = this.attributes.data;
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

    describe('creation', function() {
        it('should create a catalog', function() {
            return Q.resolve(this.model.create({
                node: "54d93422b492492333333333",
                source: 'testcatalog',
                data: {
                    testvalue1: 'test1',
                    testvalue2: 'test2'
                }
            }));
        });
    });
});

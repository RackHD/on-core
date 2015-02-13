// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var base = require('./base-spec');

describe('File Model', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').files;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('basename', function () {
            before(function () {
                this.subject = this.attributes.basename;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('filename', function () {
            before(function () {
                this.subject = this.attributes.filename;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('uuid', function () {
            before(function () {
                this.subject = this.attributes.uuid;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be a uuid', function() {
                expect(this.subject.uuidv4).to.equal(true);
            });
        });

        describe('md5', function() {
            before(function () {
                this.subject = this.attributes.md5;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

        });

        describe('sha256', function() {
            before(function () {
                this.subject = this.attributes.sha;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

        });

        describe('version', function() {
            before(function () {
                this.subject = this.attributes.sha;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('integer');
            });

            it('should default to 0', function () {
                expect(this.subject.defaultsTo).to.equal(0);
            });

        });
    });
});

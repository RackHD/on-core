// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var base = require('./base-spec');

describe('Graph Definition Model', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').graphdefinitions;
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

        describe('tasks', function () {
            before(function () {
                this.subject = this.attributes.tasks;
            });

            it('should be an array', function () {
                expect(this.subject.type).to.equal('array');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.json).to.equal(true);
            });
        });
    });
});

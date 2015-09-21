// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');

describe('Models.Profile', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').profiles;
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

        describe('contents', function () {
            before(function () {
                this.subject = this.attributes.contents;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });
    });
});

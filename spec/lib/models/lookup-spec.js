// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var base = require('./base-spec');

describe('Models.Lookup', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').lookups;
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

            it('should be a relation to the nodes model', function () {
                expect(this.subject.model).to.equal('nodes');
            });
        });

        describe('ipAddress', function () {
            before(function () {
                this.subject = this.attributes.ipAddress;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be unique', function() {
                expect(this.subject.unique).to.equal(true);
            });
        });

        describe('macAddress', function () {
            before(function () {
                this.subject = this.attributes.macAddress;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should regex with /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/', function() {
                expect(
                    this.subject.regex.toString()
                ).to.equal('/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/');
            });

            it('should be unique', function() {
                expect(this.subject.unique).to.equal(true);
            });
        });
    });
});


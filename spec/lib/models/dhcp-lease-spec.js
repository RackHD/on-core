// Copyright (c) 2015, EMC Corporation


'use strict';

var base = require('./base-spec');

describe('Models.DhcpLease', function() {
    helper.before();

    base.before(function(context) {
        context.model = helper.injector.get('Services.Waterline').dhcpleases;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function() {
        base.examples();
    });

    describe('Attributes', function () {
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

            it('should be unique', function () {
                expect(this.subject.unique).to.equal(true);
            });
        });

        describe('ip', function () {
            before(function () {
                this.subject = this.attributes.ip;
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

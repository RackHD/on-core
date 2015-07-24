// Copyright (c) 2015, EMC Corporation


'use strict';

var base = require('./base-spec');

describe('Models.Node', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').nodes;
        context.modelClass = helper.injector.get('Models.Node');
        context.catalogModel = helper.injector.get('Services.Waterline').catalogs;
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

        describe('obmSettings', function () {
            before(function () {
                this.subject = this.attributes.obmSettings;
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
            });

            it('should not be required', function () {
                expect(this.subject.required).to.equal(false);
            });
        });

        describe('workflows', function () {
            before(function () {
                this.subject = this.attributes.workflows;
            });

            it('should be a dominant relation to graphobjects via node', function () {
                expect(this.subject.collection).to.equal('graphobjects');
                expect(this.subject.via).to.equal('node');
            });
        });

        describe('catalogs', function () {
            before(function () {
                this.subject = this.attributes.catalogs;
            });

            it('should be a relation to catalogs via node', function () {
                expect(this.subject.collection).to.equal('catalogs');
                expect(this.subject.via).to.equal('node');
            });
        });

        describe('sku', function () {
            before(function () {
                this.subject = this.attributes.sku;
            });

            it('should be a relation to the skus model', function () {
                expect(this.subject.model).to.equal('skus');
            });
        });

        describe('discovered', function () {
            before(function () {
                this.subject = this.modelClass.prototype.attributes.discovered;
            });

            it('should be true if catalogs exist', function() {
                this.sandbox.stub(this.catalogModel, 'findOne').resolves([{}, {}]);
                return expect(this.subject()).to.become(true);
            });

            it('should be false if catalogs do not exist', function() {
                this.sandbox.stub(this.catalogModel, 'findOne').resolves(undefined);
                return expect(this.subject()).to.become(false);
            });
        });

        describe('snmpSettings', function() {
            before(function (){
                this.subject = this.attributes.snmpSettings;
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
            });

            it('should not be required', function () {
                expect(this.subject.required).to.equal(false);
            });
        });

        describe('autoDiscover', function () {
            before(function () {
                this.subject = this.attributes.autoDiscover;
            });

            it('should be a boolean', function() {
                expect(this.subject.type).to.equal('boolean');
            });

            it('should default to false', function () {
                expect(this.subject.defaultsTo).to.equal(false);
            });
        });
    });
});

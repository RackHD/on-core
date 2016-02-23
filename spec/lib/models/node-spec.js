// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');
var  sandbox = sinon.sandbox.create();

describe('Models.Node', function () {
    helper.before(function (context) {
        context.MessengerServices = function() {
            this.start= sandbox.stub().resolves();
            this.stop = sandbox.stub().resolves();
            this.publish = sandbox.stub().resolves();
        };
        return [
            helper.di.simpleWrapper(context.MessengerServices, 'Messenger')
        ];
    });

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

        describe('relations', function () {
            before(function () {
                this.subject = this.attributes.relations;
            });

            it('should be array', function () {
                expect(this.subject.type).to.equal('array');
            });

            it('should default to empty', function () {
                expect(this.subject.defaultsTo).to.deep.equal([]);
            });
        });

        describe('tags', function() {
            before(function() {
                this.subject = this.attributes.tags;
            });

            it('should be an array', function() {
                expect(this.subject.type).to.equal('array');
            });

            it('should default to empty', function() {
                expect(this.subject.defaultsTo).to.deep.equal([]);
            });
        });

        describe('Node Tag Functions', function() {
            var collection = {
                update: sinon.stub().resolves()
            };

            before(function() {
                sinon.stub(this.model, "native", function(cb) { cb(null, collection); });
            });

            after(function() {
                this.model.native.restore();
            });

            it('should have all valid functions', function() {
                var self = this;
                var valid = ['addTags', 'remTags', 'findByTag'];
                _.forEach(valid, function(name) {
                    expect(self.model[name]).to.exist;
                    expect(self.model).to.respondTo(name);
                });
            });

            it('addTags should call update', function() {
                var self = this;
                return this.model.addTags.call(this.model, 'id', ['tag'])
                    .then(function() {
                        expect(collection.update).to.have.been.called;
                        expect(self.model.native).to.have.been.called;
                    });
            });

            it('remTags should call update', function() {
                var self = this;
                return this.model.remTags.call(this.model, 'id', 'tag')
                    .then(function() {
                        expect(collection.update).to.have.been.called;
                        expect(self.model.native).to.have.been.called;
                    });
            });

            it('findByTag should call find', function() {
                var self = this;
                sinon.stub(this.model, "find").resolves();
                return this.model.findByTag.call(this.model, 'tag')
                    .then(function() {
                        expect(self.model.find).to.have.been.calledWith({tags: 'tag'});
                    })
                    .finally(function() {
                        self.model.find.restore();
                    });
            });

        });
    });
});

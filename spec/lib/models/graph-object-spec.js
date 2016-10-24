// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');
var  sandbox = sinon.sandbox.create();

describe('Models.GraphObject', function () {
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
        context.model = helper.injector.get('Services.Waterline').graphobjects;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('instanceId', function () {
            before(function () {
                this.subject = this.attributes.instanceId;
            });

            it('should be a uuid', function () {
                expect(this.subject.type).to.equal('string');
                expect(this.subject.uuidv4).to.be.true;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('context', function () {
            before(function () {
                this.subject = this.attributes.context;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.be.true;
            });
        });

        describe('definition', function () {
            before(function () {
                this.subject = this.attributes.definition;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.be.true;
            });
        });

        describe('tasks', function () {
            before(function () {
                this.subject = this.attributes.tasks;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.be.true;
            });
        });

        describe('node', function () {
            before(function () {
                this.subject = this.attributes.node;
            });

            it('should be a relation to node via workflows', function () {
                expect(this.subject.model).to.equal('nodes');
            });
        });
        
        describe('progress', function () {
            before(function () {
                this.subject = this.attributes.progress;
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
            });
        });
    });
});

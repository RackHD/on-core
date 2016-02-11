// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');
var  sandbox = sinon.sandbox.create();

describe('Models.GraphDefinition', function () {
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

    describe('object returned from toJSON()', function () {
        var graph;

        before('reset DB collections', function () {
            return helper.reset();
        });

        before('create record', function () {
            return this.model.create({
                friendlyName: 'Dummy',
                injectableName: 'Graph.Dummy',
                tasks: [{ /* placeholder */ }]
            }).then(function (graph_) {
                graph = graph_.toJSON();
            });
        });

        it('should not have createdAt', function () {
            expect(graph).to.not.have.property('createdAt');
        });

        it('should not have updatedAt', function () {
            expect(graph).to.not.have.property('updatedAt');
        });

        it('should not have id', function () {
            expect(graph).to.not.have.property('id');
        });
    });
});

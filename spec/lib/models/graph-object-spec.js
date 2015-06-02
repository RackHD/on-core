// Copyright (c) 2015, EMC Corporation


'use strict';

var base = require('./base-spec');

describe('Models.GraphObject', function () {
    helper.before();

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
    });

    describe('object returned from deserialize()', function () {
        var graph;

        before('reset DB collections', function () {
            return helper.reset();
        });

        before('create record', function () {
            return this.model.create({
                instanceId: '00000000-0000-4000-8000-000000000000',
                context: { /* placeholder */ },
                definition: { /* placeholder */ },
                tasks: [{ /* placeholder */ }]
            }).then(function (graph_) {
                graph = graph_.deserialize();
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

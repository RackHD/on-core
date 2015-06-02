// Copyright (c) 2015, EMC Corporation


'use strict';

var base = require('./base-spec');

describe('Models.Task', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').taskdefinitions;
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

        describe('implementsTask', function () {
            before(function () {
                this.subject = this.attributes.implementsTask;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should validate with a callback', function() {
                expect(this.subject.in).to.be.a.function;
            });
        });

        describe('options', function () {
            before(function () {
                this.subject = this.attributes.options;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
            });
        });

        describe('properties', function () {
            before(function () {
                this.subject = this.attributes.properties;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
            });
        });
    });

    describe('object returned from toJSON()', function () {
        var task;

        before('reset DB collections', function () {
            return helper.reset();
        });

        before('create record', function () {
            return this.model.create({
                friendlyName: 'Dummy',
                injectableName: 'Task.Dummy',
                implementsTask: 'Task.Base.Dummy',
                options: { /* placeholder */ },
                properties: { /* placeholder */ }
            }).then(function (task_) {
                task = task_.toJSON();
            });
        });

        it('should not have createdAt', function () {
            expect(task).to.not.have.property('createdAt');
        });

        it('should not have updatedAt', function () {
            expect(task).to.not.have.property('updatedAt');
        });

        it('should not have id', function () {
            expect(task).to.not.have.property('id');
        });
    });
});

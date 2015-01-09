// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var base = require('./base-spec'),
    _ = require('lodash');

describe('Workflow Model', function () {
    base.before(function (waterline, context) {
        context.model = waterline.workflows;
        context.attributes = context.model._attributes;
    });

    base.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('node', function () {
            beforeEach(function () {
                this.subject = this.attributes.node;
            });
        });

        describe('instance', function () {
            beforeEach(function () {
                this.subject = this.attributes.instance;
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

            it('should be a uuidv4', function () {
                expect(this.subject.uuidv4).to.equal(true);
            });
        });

        describe('name', function () {
            beforeEach(function () {
                this.subject = this.attributes.name;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('context', function () {
            beforeEach(function () {
                this.subject = this.attributes.context;
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
            });

            it('should not be required', function () {
                expect(this.subject.required).to.not.equal(true);
            });
        });

        describe('state', function () {
            beforeEach(function () {
                this.subject = this.attributes.state;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('startedAt', function () {
            beforeEach(function () {
                this.subject = this.attributes.startedAt;
            });

            it('should be a datetime', function () {
                expect(this.subject.type).to.equal('datetime');
            });

            it('should default to a function', function () {
                expect(_.isFunction(this.subject.defaultsTo)).to.equal(true);
            });
        });

        describe('completedAt', function () {
            beforeEach(function () {
                this.subject = this.attributes.completedAt;
            });

            it('should be a datetime', function () {
                expect(this.subject.type).to.equal('datetime');
            });
        });

        describe('failedAt', function () {
            beforeEach(function () {
                this.subject = this.attributes.failedAt;
            });

            it('should be a datetime', function () {
                expect(this.subject.type).to.equal('datetime');
            });
        });

        describe('error', function () {
            beforeEach(function () {
                this.subject = this.attributes.error;
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
            });

            it('should not be required', function () {
                expect(this.subject.required).to.not.equal(true);
            });
        });

        describe('type', function () {
            beforeEach(function () {
                this.subject = this.attributes.type;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be one of the required values', function () {
                expect(this.subject.in).to.deep.equal(
                    ['parentWorkflow', 'childWorkflow']
                );
            });
        });

        describe('parent', function () {
            beforeEach(function () {
                this.subject = this.attributes.parent;
            });

            it('should not be required', function () {
                expect(this.subject.required).to.not.equal(true);
            });

            it('should be a relation to the nodes model', function () {
                expect(this.subject.model).to.equal('workflows');
            });
        });

        describe('workflows', function () {
            beforeEach(function () {
                this.subject = this.attributes.workflows;
            });

            it('should be a relation to workflows via parent', function () {
                expect(this.subject.collection).to.equal('workflows');
                expect(this.subject.via).to.equal('parent');
            });
        });
    });
});

// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var base = require('./base-spec');

describe('WorkflowEvent Model', function () {
    base.before(function (waterline, context) {
        context.model = waterline.workflowevents;
        context.attributes = context.model._attributes;
    });

    base.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('workflows', function () {
            before(function () {
                this.subject = this.attributes.workflow;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be a relation to the nodes model', function () {
                expect(this.subject.model).to.equal('workflows');
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

            it('should be a uuidv4', function () {
                expect(this.subject.uuidv4).to.equal(true);
            });
        });

        describe('data', function () {
            before(function () {
                this.subject = this.attributes.data;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
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
                    ['started', 'transitioned', 'completed', 'failed']
                );
            });
        });
    });
});

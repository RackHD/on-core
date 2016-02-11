// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');

describe('Models.File', function () {
    var sandbox = sinon.sandbox.create();
    helper.before(function (context) {

        context.MessengerServices = function() {
            this.start= sandbox.stub().resolves();
            this.stop = sandbox.stub().resolves();
            this.publish = sandbox.stub().resolves();
        };
        return [
            helper.di.simpleWrapper(context.MessengerServices, 'Messenger'),
        ];
    });

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').files;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('basename', function () {
            before(function () {
                this.subject = this.attributes.basename;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('filename', function () {
            before(function () {
                this.subject = this.attributes.filename;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('uuid', function () {
            before(function () {
                this.subject = this.attributes.uuid;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be a uuid', function() {
                expect(this.subject.uuidv4).to.equal(true);
            });
        });

        describe('md5', function() {
            before(function () {
                this.subject = this.attributes.md5;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

        });

        describe('sha256', function() {
            before(function () {
                this.subject = this.attributes.sha256;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

        });

        describe('version', function() {
            before(function () {
                this.subject = this.attributes.version;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('integer');
            });

            it('should default to 0', function () {
                expect(this.subject.defaultsTo).to.equal(0);
            });

        });
    });

    describe('object returned from toJSON()', function () {
        var file;

        before('reset DB collections', function () {
            return helper.reset();
        });

        before('create record', function () {
            return this.model.create({
                basename: 'test.txt',
                filename: 'asdf/test.txt',
                uuid: '00000000-0000-4000-8000-000000000000',
                md5: '1748378563801794b10c9d8b109d6b10',
                sha256: '1748378563801794b10c9d8b109d6b101748378563801794b10c9d8b109d6b10'
            }).then(function (file_) {
                file = file_.toJSON();
            }).catch(function (err) {
                console.log(err);
                throw err;
            });
        });

        it('should not have createdAt', function () {
            expect(file).to.not.have.property('createdAt');
        });

        it('should not have updatedAt', function () {
            expect(file).to.not.have.property('updatedAt');
        });

        it('should not have id', function () {
            expect(file).to.not.have.property('id');
        });
    });
});

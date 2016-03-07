// Copyright 2016, EMC, Inc.


'use strict';

var base = require('./base-spec');
var  sandbox = sinon.sandbox.create();

describe('Models.LocalUsers', function () {
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
        context.model = helper.injector.get('Services.Waterline').localusers;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('username', function () {
            before(function () {
                this.subject = this.attributes.username;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('password', function () {
            before(function () {
                this.subject = this.attributes.password;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('role', function () {
            before(function () {
                this.subject = this.attributes.role;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });
        });
    });

    describe('Password functions', function () {
        beforeEach(function () {
            return helper.reset();
        });

        it('should serialize a password', function () {
            return this.model.create({
                username: 'admin',
                password: 'admin123'
            }).then(function(user) {
                expect(user.username).to.equal('admin');
                expect(user.password).to.not.equal('admin123');
            });
        });

        it('should validate a password', function() {
            return this.model.create({
                username: 'readonly',
                password: 'read123'
            }).then(function(user) {
                expect(user.password).to.not.equal('read123');
                expect(user.comparePassword('read123')).to.be.true;
                expect(user.comparePassword('badread')).to.be.false;
            })
        });
    });
});

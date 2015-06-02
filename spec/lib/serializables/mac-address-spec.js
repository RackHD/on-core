// Copyright (c) 2015, EMC Corporation
/* jshint node:true */

'use strict';

describe('MacAddress', function () {
    var MacAddress, Serializable, Validatable, Errors;

    helper.before();

    before(function () {
        MacAddress = helper.injector.get('MacAddress');
        Serializable = helper.injector.get('Serializable');
        Validatable = helper.injector.get('Validatable');
        Errors = helper.injector.get('Errors');
    });

    before(function () {
        this.subject = new MacAddress({ value: '00:11:22:33:44:55' });
    });

    helper.after();

    describe('constructor', function () {
        it('should be Serializable', function () {
            this.subject.should.be.an.instanceof(Serializable);
        });

        it('should be Validatable', function () {
            this.subject.should.be.an.instanceof(Validatable);
        });

        it('should assign value to value', function () {
            this.subject.value.should.equal('00:11:22:33:44:55');
        });
    });

    describe('validation', function () {
        describe('resolved', function () {
            it('should resolve if valid', function () {
                return this.subject.validate();
            });
        });

        describe('rejected', function () {
            it('should reject if value is not present', function () {
                return new MacAddress().validate().should.be.rejectedWith(Errors.SchemaError);
            });

            it('should reject if value is not a mac address', function () {
                return new MacAddress(
                    { value: 'invalid' }
                ).validate().should.be.rejectedWith(Errors.SchemaError);
            });
        });
    });
});
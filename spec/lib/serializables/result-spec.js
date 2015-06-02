// Copyright (c) 2015, EMC Corporation
/* jshint node:true */

'use strict';

describe('Result', function () {
    var Result, Serializable, Validatable;

    helper.before();

    before(function () {
        Result = helper.injector.get('Result');
        Serializable = helper.injector.get('Serializable');
        Validatable = helper.injector.get('Validatable');
    });

    before(function () {
        this.subject = new Result({ value: 'random' });
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
            this.subject.value.should.equal('random');
        });
    });

    describe('validation', function () {
        describe('resolved', function () {
            it('should resolve if valid', function () {
                return this.subject.validate().should.be.resolved;
            });

            it('should resolve if not valid since it has no rules', function () {
                return new Result().validate().should.be.resolved;
            });
        });
    });
});
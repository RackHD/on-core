// Copyright (c) 2015, EMC Corporation
/* jshint node:true */

'use strict';

describe('ErrorEvent', function () {
    var ErrorEvent, Serializable, Validatable;

    helper.before();

    before(function () {
        ErrorEvent = helper.injector.get('ErrorEvent');
        Serializable = helper.injector.get('Serializable');
        Validatable = helper.injector.get('Validatable');
    });

    helper.after();

    describe('constructor', function () {
        before(function () {
            var error = new Error('test');

            error.context = { hello: 'world' };

            this.subject = new ErrorEvent(error);
        });

        it('should be Serializable', function () {
            this.subject.should.be.an.instanceof(Serializable);
        });

        it('should be Validatable', function () {
            this.subject.should.be.an.instanceof(Validatable);
        });

        it('should assign error.name to name', function () {
            this.subject.name.should.equal('Error');
        });

        it('should assign error.message to message', function () {
            this.subject.message.should.equal('test');
        });

        it('should assign error.stack to stack', function () {
            this.subject.stack.should.not.equal(undefined);
        });

        it('should assign error.context to context', function () {
            this.subject.context.should.have.property('hello', 'world');
        });
    });
});
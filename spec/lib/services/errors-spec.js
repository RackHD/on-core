// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */
/* jshint expr:true */

'use strict';

describe("Errors", function() {
    var Errors;

    helper.before();

    before(function () {
        Errors = helper.injector.get('Errors');
    });

    helper.after();

    describe('BaseError', function () {
        before(function () {
            this.subject = new Errors.BaseError('message');
        });

        it('should be an instance of Error', function () {
            expect(this.subject).to.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            expect(this.subject).to.be.an.instanceof(Errors.BaseError);
        });

        it('should have a name of BaseError', function () {
            expect(this.subject.name).to.be.equal('BaseError');
        });

        it('should have a message of message', function () {
            expect(this.subject.message).to.be.equal('message');
        });

        it('should provide the correct stack trace', function () {
            expect(this.subject.stack.split('\n')[1]).to.contain(__filename);
        });
    });

    describe('MyError', function () {
        before(function () {
            this.subject = new Errors.MyError('message');
        });

        it('should be an instance of Error', function () {
            expect(this.subject).to.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            expect(this.subject).to.be.an.instanceof(Errors.BaseError);
        });

        it('should be an instance of MyError', function () {
            expect(this.subject).to.be.an.instanceof(Errors.MyError);
        });

        it('should have a name of MyError', function () {
            expect(this.subject.name).to.be.equal('MyError');
        });

        it('should have a message of message', function () {
            expect(this.subject.message).to.be.equal('message');
        });

        it('should provide the correct stack trace', function () {
            expect(this.subject.stack.split('\n')[1]).to.contain(__filename);
        });
    });
});

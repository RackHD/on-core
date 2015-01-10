// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */
/* jshint expr:true */

'use strict';

describe("Errors", function() {
    var Errors = helper.baseInjector.get('Errors');

    describe('BaseError', function () {
        var error = new Errors.BaseError('message');

        it('should be an instance of Error', function () {
            expect(error).to.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            expect(error).to.be.an.instanceof(Errors.BaseError);
        });

        it('should have a name of BaseError', function () {
            expect(error.name).to.be.equal('BaseError');
        });

        it('should have a message of message', function () {
            expect(error.message).to.be.equal('message');
        });

        it('should provide the correct stack trace', function () {
            expect(error.stack.split('\n')[1]).to.contain(__filename);
        });
    });

    describe('MyError', function () {
        var error = new Errors.MyError('message');

        it('should be an instance of Error', function () {
            expect(error).to.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            expect(error).to.be.an.instanceof(Errors.BaseError);
        });

        it('should be an instance of MyError', function () {
            expect(error).to.be.an.instanceof(Errors.MyError);
        });

        it('should have a name of MyError', function () {
            expect(error.name).to.be.equal('MyError');
        });

        it('should have a message of message', function () {
            expect(error.message).to.be.equal('message');
        });

        it('should provide the correct stack trace', function () {
            expect(error.stack.split('\n')[1]).to.contain(__filename);
        });
    });
});

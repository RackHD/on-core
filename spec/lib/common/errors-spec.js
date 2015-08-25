// Copyright (c) 2015, EMC Corporation



'use strict';

describe("Errors", function() {
    var Errors;

    helper.before();

    before(function () {
        Errors = helper.injector.get('Errors');
    });

    helper.after();

    describe('Error', function () {
        describe('toJSON', function () {
            before(function () {
                this.subject = new Error('test').toJSON();
            });

            it('should have a name property', function () {
                this.subject.name.should.equal('Error');
            });

            it('should have a message property', function () {
                this.subject.message.should.equal('test');
            });

            it('should have a stack property', function () {
                this.subject.stack.should.not.equal(undefined);
            });

            it('should have a context property', function () {
                this.subject.context.should.deep.equal({});
            });

            it('should include additional properties in context', function () {
                var error = new Error('test');
                error.status = 200;
                error.toJSON().context.status.should.equal(200);
            });
        });
    });

    describe('BaseError', function () {
        before(function () {
            this.subject = new Errors.BaseError('message');
        });

        it('should be an instance of Error', function () {
            this.subject.should.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            this.subject.should.be.an.instanceof(Errors.BaseError);
        });

        it('should have a name of BaseError', function () {
            this.subject.name.should.be.equal('BaseError');
        });

        it('should have a message of message', function () {
            this.subject.message.should.be.equal('message');
        });

        it('should provide the correct stack trace', function () {
            this.subject.stack.split('\n')[1].should.contain(__filename);
        });
    });

    describe('BadRequestError', function () {
        before(function () {
            this.subject = new Errors.BadRequestError('message');
        });

        it('should be an instance of Error', function () {
            this.subject.should.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            this.subject.should.be.an.instanceof(Errors.BaseError);
        });

        it('should be an instance of BadRequestError', function () {
            this.subject.should.be.an.instanceof(Errors.BadRequestError);
        });

        it('should have a name of BadRequestError', function () {
            this.subject.name.should.be.equal('BadRequestError');
        });

        it('should have a message of message', function () {
            this.subject.message.should.be.equal('message');
        });

        it('should provide the correct stack trace', function () {
            this.subject.stack.split('\n')[1].should.contain(__filename);
        });

        it('should provide a 400 status', function () {
            this.subject.status.should.equal(400);
        });
    });

    describe('MyError', function () {
        before(function () {
            this.subject = new Errors.MyError('message');
        });

        it('should be an instance of Error', function () {
            this.subject.should.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            this.subject.should.be.an.instanceof(Errors.BaseError);
        });

        it('should be an instance of MyError', function () {
            this.subject.should.be.an.instanceof(Errors.MyError);
        });

        it('should have a name of MyError', function () {
            this.subject.name.should.be.equal('MyError');
        });

        it('should have a message of message', function () {
            this.subject.message.should.be.equal('message');
        });

        it('should provide the correct stack trace', function () {
            this.subject.stack.split('\n')[1].should.contain(__filename);
        });
    });

    describe('BreakPromiseChainError', function () {
        before(function () {
            this.subject = new Errors.BreakPromiseChainError();
        });

        it('should be an instance of Error', function () {
            this.subject.should.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            this.subject.should.be.an.instanceof(Errors.BaseError);
        });

        it('should be an instance of BreakPromiseChainError', function () {
            this.subject.should.be.an.instanceof(Errors.BreakPromiseChainError);
        });

        it('should have a name of BreakPromiseChainError', function () {
            this.subject.name.should.be.equal('BreakPromiseChainError');
        });

        it('should have a stock message', function () {
            this.subject.message.should.be.equal('Break Promise Chain');
        });

        it('should provide the correct stack trace', function () {
            this.subject.stack.split('\n')[1].should.contain(__filename);
        });
    });

    describe('JobKilledError', function () {
        before(function () {
            this.subject = new Errors.JobKilledError();
        });

        it('should be an instance of Error', function () {
            this.subject.should.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            this.subject.should.be.an.instanceof(Errors.BaseError);
        });

        it('should be an instance of JobKilledError', function () {
            this.subject.should.be.an.instanceof(Errors.JobKilledError);
        });

        it('should have a name of JobKilledError', function () {
            this.subject.name.should.be.equal('JobKilledError');
        });

        it('should provide the correct stack trace', function () {
            this.subject.stack.split('\n')[1].should.contain(__filename);
        });
    });

    describe('MaxGraphsRunningError', function () {
        before(function () {
            this.subject = new Errors.MaxGraphsRunningError();
        });

        it('should be an instance of Error', function () {
            this.subject.should.be.an.instanceof(Error);
        });

        it('should be an instance of BaseError', function () {
            this.subject.should.be.an.instanceof(Errors.BaseError);
        });

        it('should be an instance of MaxGraphsRunningError', function () {
            this.subject.should.be.an.instanceof(Errors.MaxGraphsRunningError);
        });

        it('should have a name of MaxGraphsRunningError', function () {
            this.subject.name.should.be.equal('MaxGraphsRunningError');
        });

        it('should provide the correct stack trace', function () {
            this.subject.stack.split('\n')[1].should.contain(__filename);
        });
    });
});

// Copyright 2015, EMC, Inc.


'use strict';

describe('Encryption Service', function () {
    var Encryption;

    helper.before();

    before(function () {
        Encryption = helper.injector.get('Encryption');
        this.subject = helper.injector.get('Services.Encryption');
    });

    helper.after();

    describe('encrypt', function () {
        it('should call Encryption.prototype.encrypt', function () {
            var encrypt = this.sandbox.stub(Encryption.prototype, 'encrypt');

            this.subject.encrypt('Hello World');

            encrypt.should.have.been.calledWith('Hello World');
        });

        it('should return the data if already encrypted', function() {
            var target = this.subject.encrypt('NOOP');

            this.subject.encrypt(target).should.equal(target);
        });
    });

    describe('decrypt', function () {
        it('should call Encryption.prototype.decrypt', function () {
            var decrypt = this.sandbox.stub(Encryption.prototype, 'decrypt'),
                target = this.subject.encrypt('Hello World');

            this.subject.decrypt(target);

            decrypt.should.have.been.calledWith(target);
        });

        it('should return the data if already decrypted', function() {
            this.subject.decrypt('NOOP').should.equal('NOOP');
        });
    });
});

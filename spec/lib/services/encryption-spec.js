// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

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
    });

    describe('decrypt', function () {
        it('should call Encryption.prototype.decrypt', function () {
            var decrypt = this.sandbox.stub(Encryption.prototype, 'decrypt');

            this.subject.decrypt('ENCRYPTEDLOL');

            decrypt.should.have.been.calledWith('ENCRYPTEDLOL');
        });
    });
});

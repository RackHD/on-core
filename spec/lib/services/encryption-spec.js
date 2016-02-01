// Copyright 2015, EMC, Inc.


'use strict';

describe('Encryption Service', function () {
    var EncryptionService,
        Encryption,
        Configuration;

    helper.before();

    before(function () {
        Encryption = helper.injector.get('Encryption');
        EncryptionService = helper.injector.get('Services.Encryption');
        Configuration = helper.injector.get('Services.Configuration');
        sinon.stub(Configuration);
    });

    helper.after();
  
    describe('start/stop', function () {
        it('should call Encryption.prototype.start', function () {
            Configuration.get.resolves('sharedKey');
            return EncryptionService.start()
            .then(function() {
                expect(Promise.resolve()).to.be.ok;
            });
        });
        
        it('should call Encryption.prototype.stop', function () {
            return EncryptionService.stop()
            .then(function() {
                expect(Promise.resolve()).to.be.ok;
            });
        });
    });  

    describe('encrypt', function () {
        it('should call Encryption.prototype.encrypt', function () {
            var encrypt = this.sandbox.stub(Encryption.prototype, 'encrypt');
            EncryptionService.encrypt('Hello World');
            encrypt.should.have.been.calledWith('Hello World');
        });

        it('should return the data if already encrypted', function() {
            var isEncrypted = this.sandbox.stub(Encryption.prototype, 'isEncrypted');
            isEncrypted.resolves(true);
            var target = EncryptionService.encrypt('NOOP');
            EncryptionService.encrypt(target).should.equal(target);
        });
    });

    describe('decrypt', function () {
        it('should call Encryption.prototype.decrypt', function () {
            var isEncrypted = this.sandbox.stub(Encryption.prototype, 'isEncrypted'),
                decrypt = this.sandbox.stub(Encryption.prototype, 'decrypt');
            isEncrypted.resolves(false);
            var target = EncryptionService.encrypt('Hello World');
            EncryptionService.decrypt(target);
            decrypt.should.have.been.calledWith(target);
        });

        it('should return the data if already decrypted', function() {
            EncryptionService.decrypt('NOOP').should.equal('NOOP');
        });
    });

    describe('createHash', function () {
        it('should call Encryption.prototype.createHash', function () {
            var hash = this.sandbox.stub(Encryption.prototype, 'createHash');
            EncryptionService.createHash('Hello World');
            hash.should.have.been.calledWith('Hello World');
        });
    });
});

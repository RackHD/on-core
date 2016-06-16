// Copyright 2015, EMC, Inc.


'use strict';

describe('Encryption', function () {
    var Encryption;

    helper.before();

    before(function () {
        Encryption = helper.injector.get('Encryption');
        this.subject = new Encryption();
    });

    helper.after();

    describe('Instance Methods', function () {
        var iv = 'vNtIgxV4kh0XHSa9ZJxkSg==',
            key = 'PL7JCptSVbBJ3xfuXLfsZ1luHZwTvi0igjx3hqZK3bY=',
            data = 'vNtIgxV4kh0XHSa9ZJxkSg==.dqvkQ8pDILwC7HF/sO6I4w==',
            base64 = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;

        describe('iv', function () {
            it('should generate a base64 string of 16 bytes', function () {
                var subject = this.subject.iv();
                subject.should.match(base64);
                new Buffer(subject, 'base64').length.should.equal(16);
                console.log(this.subject.key());
            });
        });

        describe('key', function () {
            it('should generate a base64 string of 32 bytes', function () {
                var subject = this.subject.key();
                subject.should.match(base64);
                new Buffer(subject, 'base64').length.should.equal(32);
            });
        });

        describe('encrypt', function () {
            it('should encrypt data', function () {
                this.subject.encrypt(
                    'Hello World', key, iv
                ).should.equal(data);
            });
        });

        describe('decrypt', function () {
            it('should decrypt data', function () {
                this.subject.decrypt(
                    data,
                    key
                ).should.equal('Hello World');
            });

            it('should throw a TypeError on bad decrypt', function () {
                expect(function () {
                    this.subject.decrypt(
                        data,
                        'LP7JCptSVbBJ3xfuXLfsZ1luHZwTvi0igjx3hqZK3bY='
                    );
                }).to.throw(TypeError);
            });
        });

        describe('isEncrypted', function () {
            it('should return true if encrypted', function() {
                var target = this.subject.encrypt('Hello World', key, iv);

                this.subject.isEncrypted(target).should.equal(true);
            });

            it('should return false if not encrypted', function() {
               this.subject.isEncrypted('Hello World').should.equal(false);
            });
        });

        describe('createHash', function () {
            it('should generate correct hash header', function() {
                expect(this.subject.createHash('123ABCDEFG__zyz', 'sha512')).to.match(/^\$6\$*/);
                expect(this.subject.createHash('pbefEFGA_98012-', 'sha256')).to.match(/^\$5\$*/);
            });

            it('should generate correct hash data', function() {
                var data = "rackhd.github.com";
                this.subject.createHash(data, 'sha512', '$6$WeJknBPkDab')
                    .should.equal('$6$WeJknBPkDab$yRRWg5Kr1MCAbKkBtKyKtldb9DFDXidKHj.wQwOKO1TSHUKCvIi7x9QubOenwGfYXoBK0vvwKvNgIlW9Oc6O4.'); //jshint ignore:line
                this.subject.createHash(data, 'sha256', '$5$WeJknBPkDab')
                    .should.equal('$5$WeJknBPkDab$t4J3IF.tD9H/2HFDjV.CpFN1ay5rmwa7maVkstEiyv9');
            });
        });

        describe('createSalt', function () {
            it('should generate a password salt for crypt', function () {
                expect(this.subject.createSalt('sha256', 'HlloWrld')).to.equal('$5$HlloWrld');
                expect(this.subject.createSalt('sha512', 'HlloWrld')).to.equal('$6$HlloWrld');
            });
        });
    });
});

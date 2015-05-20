// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

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
    });
});

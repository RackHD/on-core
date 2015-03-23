// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('FileLoader', function () {
    var FileLoader;

    helper.before();

    before(function () {
        FileLoader = helper.injector.get('FileLoader');

        this.fs = helper.injector.get('fs');
        this.subject = new FileLoader();
    });

    helper.after(function () {
        this.fs.writeFile.restore();
        this.fs.readFile.restore();
        this.fs.readdir.restore();
    });

    describe('put', function () {
        it('should write the contents to the specified file', function () {
            var self = this;

            self.fs.writeFile = sinon.stub().yields(undefined, 'put');

            return this.subject.put('filename', 'contents').then(function (contents) {
                self.fs.writeFile.should.have.been.calledWith('filename', 'contents');

                contents.should.equal('put');
            });
        });
    });

    describe('get', function () {
        it('should get the contents for the specified file', function () {
            var self = this;

            self.fs.readFile = sinon.stub().yields(undefined, 'get');

            return this.subject.get('filename').then(function (contents) {
                self.fs.writeFile.should.have.been.calledWith('filename');

                contents.should.equal('get');
            });
        });
    });

    describe('getAll', function () {
        it(
            'should return a promise fulfilled with the file basename to contents in an object',
            function () {
                var self = this;

                self.fs.readFile = sinon.stub().yields(undefined, 'getAll');
                self.fs.readdir = sinon.stub().yields(undefined, ['/tmp/foo.txt']);

                return this.subject.getAll('/tmp').then(function (files) {
                    self.fs.readdir.should.have.been.calledWith('/tmp');

                    files['foo.txt'].should.equal('getAll');
                });
            }
        );
    });
});
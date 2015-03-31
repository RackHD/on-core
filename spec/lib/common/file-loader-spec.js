// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('FileLoader', function () {
    var FileLoader;
    var fs;

    helper.before();

    before(function () {
        FileLoader = helper.injector.get('FileLoader');
        fs = helper.injector.get('fs');

        this.subject = new FileLoader();

        sinon.stub(fs, 'writeFile');
        sinon.stub(fs, 'readFile');
        sinon.stub(fs, 'readdir');
    });

    beforeEach(function() {
        fs.writeFile.reset();
        fs.readFile.reset();
        fs.readdir.reset();
    });

    helper.after(function () {
        fs.writeFile.restore();
        fs.readFile.restore();
        fs.readdir.restore();
    });

    describe('put', function () {
        it('should write the contents to the specified file', function () {
            fs.writeFile.yields(undefined, 'put');

            return this.subject.put('filename', 'contents').then(function (contents) {
                fs.writeFile.should.have.been.calledWith('filename', 'contents');

                contents.should.equal('put');
            });
        });
    });

    describe('get', function () {
        it('should get the contents for the specified file', function () {
            fs.readFile.yields(undefined, 'get');

            return this.subject.get('filename').then(function (contents) {
                fs.readFile.should.have.been.calledWith('filename');

                contents.should.equal('get');
            });
        });
    });

    describe('getAll', function () {
        it(
            'should return a promise fulfilled with the file basename to contents in an object',
            function () {
                fs.readFile.yields(undefined, 'getAll');
                fs.readdir.yields(undefined, ['/tmp/foo.txt']);

                return this.subject.getAll('/tmp').then(function (files) {
                    fs.readdir.should.have.been.calledWith('/tmp');

                    files['foo.txt'].should.equal('getAll');
                });
            }
        );
    });
});

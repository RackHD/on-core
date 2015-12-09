// Copyright 2015, EMC, Inc.


'use strict';

describe('FileLoader', function () {
    var FileLoader;
    var fs;

    helper.before();

    before(function () {
        FileLoader = helper.injector.get('FileLoader');
        fs = helper.injector.get('fs');

        this.subject = new FileLoader();

        sinon.stub(fs, 'writeFileAsync');
        sinon.stub(fs, 'readFileAsync');
        sinon.stub(fs, 'readdirAsync');
        sinon.stub(fs, 'statAsync');
    });

    beforeEach(function() {
        fs.writeFileAsync.reset();
        fs.readFileAsync.reset();
        fs.readdirAsync.reset();
        fs.statAsync.reset();
    });

    helper.after(function () {
        fs.writeFileAsync.restore();
        fs.readFileAsync.restore();
        fs.readdirAsync.restore();
        fs.statAsync.restore();
    });

    describe('put', function () {
        it('should write the contents to the specified file', function () {
            fs.writeFileAsync.resolves('put');

            return this.subject.put('filename', 'contents').then(function (contents) {
                fs.writeFileAsync.should.have.been.calledWith('filename', 'contents');

                contents.should.equal('put');
            });
        });
    });

    describe('get', function () {
        it('should get the contents for the specified file', function () {
            fs.readFileAsync.resolves('get');

            return this.subject.get('filename').then(function (contents) {
                fs.readFileAsync.should.have.been.calledWith('filename');

                contents.should.equal('get');
            });
        });
    });

    describe('getAll', function () {
        it(
            'should return a promise fulfilled with the file basename to contents in an object',
            function () {
                fs.readFileAsync.resolves('getAll');
                fs.readdirAsync.resolves(['/tmp/foo.txt']);
                fs.statAsync.resolves({ isDirectory: function() { return false; } });
                return this.subject.getAll('/tmp').then(function (files) {
                    fs.readdirAsync.should.have.been.calledWith('/tmp');

                    files['foo.txt'].should.equal('getAll');
                });
            }
        );
        it(
            'should skip directories',
            function () {
                fs.readFileAsync.resolves('getAll');
                fs.readdirAsync.resolves(['/tmp/foo']);
                fs.statAsync.resolves({ isDirectory: function() { return true; } });
                return this.subject.getAll('/tmp').then(function (files) {
                    fs.readdirAsync.should.have.been.calledWith('/tmp');
                    fs.readFileAsync.should.not.have.been.called;
                });
            }
        );
    });
});

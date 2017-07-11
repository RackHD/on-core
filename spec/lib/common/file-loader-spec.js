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
    });

    beforeEach(function() {
        this.sandbox.stub(fs, 'writeFileAsync');
        this.sandbox.stub(fs, 'readFileAsync');
        this.sandbox.stub(fs, 'readdirAsync');
        this.sandbox.stub(fs, 'statAsync');
    });

    helper.after();

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
                fs.readdirAsync.resolves(['foo.txt']);
                fs.statAsync.resolves({ isDirectory: function() { return false; } });
                return this.subject.getAll('/tmp').then(function (files) {
                    fs.readdirAsync.should.have.been.calledWith('/tmp');

                    files['foo.txt'].should.have.property('path')
                        .and.to.equal('/tmp/foo.txt');
                    files['foo.txt'].should.have.property('contents')
                        .and.to.equal('getAll');
                });
            }
        );
        it(
            'should skip directories when recursive is disabled',
            function () {
                fs.readFileAsync.resolves('getAll');
                fs.readdirAsync.resolves(['foo']);
                fs.statAsync.resolves({ isDirectory: function() { return true; } });
                return this.subject.getAll('/tmp').then(function () {
                    fs.readdirAsync.should.have.been.calledWith('/tmp');
                    fs.readFileAsync.should.not.have.been.called;
                });
            }
        );
        it(
            'should not skip directories when recursive is enabled',
            function () {
                fs.readFileAsync.resolves('getAll');
                fs.readdirAsync.withArgs('/tmp').resolves(['foo']);
                fs.readdirAsync.withArgs('/tmp/foo').resolves([]);
                fs.statAsync.resolves({ isDirectory: function() { return true; } });
                return this.subject.getAll('/tmp', true).then(function () {
                    fs.readdirAsync.should.have.been.calledWith('/tmp');
                    fs.readdirAsync.should.have.been.calledWith('/tmp/foo');
                    fs.readFileAsync.should.not.have.been.called;
                });
            }
        );
    });
});

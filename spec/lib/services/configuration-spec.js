// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe(require('path').basename(__filename), function () {
    var Constants, fs, nconf;

    helper.before();

    before(function () {
        Constants = helper.injector.get('Constants');
        fs = helper.injector.get('fs');
        nconf = helper.injector.get('nconf');
        this.subject = helper.injector.get('Services.Configuration');
    });

    helper.after();

    describe('Instance Methods', function () {
        describe('set', function() {
            it('should chain', function() {
                this.subject.set('foo', 'bar').should.equal(this.subject);
            });

            it('should set the key to the given value', function() {
                this.subject.set('foo', 'bar').get('foo').should.equal('bar');
            });
        });

        describe('get', function() {
            it('should return the requested value', function() {
                this.subject.set('foo', 'bar').get('foo').should.equal('bar');
            });

            it('should use the default value provided if no value is defined', function() {
                this.subject.get('missing', 'override').should.be.equal('override');
            });
        });

        describe('getAll', function() {
            it('should return all configuration values', function() {
                this.subject.getAll().should.be.an('object');
            });
        });

        describe('start', function () {
            describe('overrides', function () {
                before(function () {
                    sinon.stub(fs, 'existsSync').withArgs(
                        Constants.Configuration.Files.Overrides
                    ).returns(true);

                    sinon.stub(nconf, 'file').returns();
                });

                after(function () {
                    fs.existsSync.restore();

                    nconf.file.restore();
                });

                it('applies overrides from overrides.json', function() {
                    this.subject.load();
                    nconf.file.should.have.been.calledWith(
                        'overrides',
                        Constants.Configuration.Files.Overrides
                    );
                });
            });

            describe('defaults', function () {
                before(function () {
                    sinon.stub(fs, 'existsSync').withArgs(
                        Constants.Configuration.Files.Default
                    ).returns(true);

                    sinon.stub(nconf, 'file').returns();
                });

                after(function () {
                    fs.existsSync.restore();

                    nconf.file.restore();
                });

                it('applies defaults from config.json', function() {
                    this.subject.load();
                    nconf.file.should.have.been.calledWith(
                        'config',
                        Constants.Configuration.Files.Default
                    );
                });
            });
        });
    });
});

// Copyright 2015, EMC, Inc.


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
            describe('defaults', function () {
                beforeEach(function () {
                    sinon.stub(fs, 'existsSync');
                    sinon.stub(nconf, 'file').returns();
                });

                afterEach(function () {
                    fs.existsSync.restore();
                    nconf.file.restore();
                });

                it('applies defaults from the global configuration file', function() {
                    fs.existsSync.withArgs( Constants.Configuration.Files.Global ).returns(true);
                    this.subject.load();
                    nconf.file.should.have.been.calledWith( 'global', Constants.Configuration.Files.Global );
                });
                it('applies defaults from the OnRack configuration file', function() {
                    fs.existsSync.withArgs( Constants.Configuration.Files.OnRack ).returns(true);
                    this.subject.load();
                    nconf.file.should.have.been.calledWith( 'global', Constants.Configuration.Files.OnRack );
                });
            });
        });
    });
});

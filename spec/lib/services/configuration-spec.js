// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe(require('path').basename(__filename), function () {
    helper.before();

    before(function () {
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
    });
});


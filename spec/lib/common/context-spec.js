// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Context', function () {
    var Context;

    helper.before();

    before(function () {
        Context = helper.injector.get('Context');
    });

    helper.after();

    describe('constructor', function () {
        it('should assign id to the provided value', function () {
            var subject = new Context('id');
            subject.id.should.equal('id');
        });

        it('should assign a value to id if none is provided', function () {
            var subject = new Context();
            should.not.equal(subject.id, undefined);
        });
    });

    describe('get', function () {
        beforeEach(function () {
            this.subject = new Context('get');
        });

        it('should return the requested value if present', function () {
            this.subject.get('id').should.equal('get');
        });

        it('should return undefined if the value is not present', function () {
            should.equal(this.subject.get('foo'), undefined);
        });

        it('should return the default value if specified', function () {
            this.subject.get('foo', 'bar').should.equal('bar');
        });
    });

    describe('set', function () {
        beforeEach(function () {
            this.subject = new Context('set');
        });

        it('should set the object key to the specified value', function () {
            this.subject.set('foo', 'bar');
            this.subject.foo.should.equal('bar');
        });

        it('should chain itself for subsequent calls', function () {
            this.subject.set('foo', 'bar').get('foo').should.equal('bar');
        });
    });

    describe('push', function () {
        beforeEach(function () {
            this.subject = new Context('set');
        });

        it('should push the value onto the specified value array', function () {
            this.subject.push('foo', 'bar');
            this.subject.foo.should.deep.equal(['bar']);
        });

        it('should chain itself for subsequent calls', function () {
            this.subject.push('foo', 'bar').foo.should.deep.equal(['bar']);
        });
    });

    describe('pop', function () {
        beforeEach(function () {
            this.subject = new Context('pop');

            this.subject.push('key', 'value');
        });

        it('should pop the last value off the specified array', function () {
            this.subject.pop('key').should.equal('value');
        });

        it('should return undefined if there are no more values', function () {
            should.equal(this.subject.pop('pop'), undefined);
        });
    });
});
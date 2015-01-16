// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Constants', function () {
    helper.before(function (context) {
        context.subject = helper.injector.get('Constants');
    });

    helper.after();

    it('should be an object', function () {
        expect(this.subject).to.be.an('object');
    });

    it('should be frozen', function () {
        var subject = this.subject;

        expect(function () {
            subject.foo = 'bar';
        }).to.throw(TypeError);
    });
});
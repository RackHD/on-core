// Copyright 2015, EMC, Inc.


'use strict';

describe('Constants', function () {
    helper.before();

    before(function () {
        this.subject = helper.injector.get('Constants');
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
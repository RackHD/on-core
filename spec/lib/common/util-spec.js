// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

var di = require('di');

describe('Util', function () {
    var util;

    helper.before();

    before(function () {
        util = helper.injector.get('Util');
    });

    helper.after();

    describe('inheritsStatic', function () {
        it('needs tests');
    });

    describe('inheritsAll', function () {
        it('needs tests');
    });

    describe('provides', function () {
        it('should return the provides annotation on functions', function () {
            function Test () {}

            di.annotate(Test, new di.Provide('ProvidedByTest'));

            util.provides(Test).should.equal('ProvidedByTest');
        });

        it('should return undefined if no annotation is present', function () {
            function Test () {}

            should.equal(util.provides(Test), undefined);
        });

        it('should return undefined if the provided argument is not a function', function () {
            should.equal(util.provides(), undefined);
            should.equal(util.provides('Not a Function'), undefined);
        });
    });
});
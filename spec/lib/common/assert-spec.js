// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */
/* jshint expr:true */

'use strict';

// Required because they are used pre-initialization of injector
// for building out test cases.
var assertPlus = require('assert-plus');
var validator = require('validator');

describe("AssertService", function() {
    var assert, config;

    helper.before();

    before(function () {
        assert = helper.injector.get('Assert'),
        config = helper.injector.get('Services.Configuration');
    });

    helper.after();

    _.methods(assertPlus).forEach(function (method) {
        it('should have a ' + method + ' method', function () {
            expect(assert).to.respondTo(method);
        });
    });

    it('should work the way assert-plus intended', function () {
        expect(function () {
            assert.bool('not a bool');
        }).to.throw();

        expect(function () {
            assert.bool(true);
        }).to.not.throw();

        expect(function () {
            assert.bool(false);
        }).to.not.throw();

        expect(function () {
            assert.ok(undefined);
        }).to.throw();
    });

    _.methods(validator).forEach(function (method) {
        it('should have a ' + method + ' method', function () {
            expect(assert).to.respondTo(method);
        });
    });

    it('should work the way validator intended', function () {
        expect(function () {
            assert.isIP('not an ip');
        }).to.throw();

        expect(function () {
            assert.isIP('10.1.1.1');
        }).to.not.throw();
    });
});

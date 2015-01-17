// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */
/* jshint expr:true */

'use strict';

var assertPlus = require('assert-plus');

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
        config.set('assert', 'throw');

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

    it('should noop if configured off', function () {
        expect(function() {
            config.set('assert', 'off');

            assert.ok(false);
        }).to.not.throw();
    });

    it('should log only if configured to log', function () {
        expect(function () {
            config.set('assert', 'log');

            assert.ok(undefined);
        }).to.not.throw();
    });

    it('should exit if configured to exit');
});

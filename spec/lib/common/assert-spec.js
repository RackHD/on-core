// Copyright (c) 2015, EMC Corporation



'use strict';

// Required because they are used pre-initialization of injector
// for building out test cases.
var assertPlus = require('assert-plus');
var validator = require('validator');

describe("AssertService", function() {
    var assert;

    helper.before();

    before(function () {
        assert = helper.injector.get('Assert');
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

    describe('arguments', function () {
        it('should do throw if no arguments are present', function () {
            expect(function () {
                assert.isMac();
            }).to.throw();

            expect(function () {
                assert.ok();
            }).to.throw();
        });
    });

    describe('macaddress', function () {
        it('should throw on an invalid mac address', function () {
            expect(function () {
                assert.isMac('invalid');
            }).to.throw();

            expect(function () {
                assert.isMac('00:11:22:33:44:55:66');
            }).to.throw();

            expect(function () {
                assert.isMac('00:11:22:33:44');
            }).to.throw();
        });

        it('should not throw on a valid mac address', function () {
            expect(function () {
                assert.isMac('00:11:22:33:44:55');
            });
        });
    });
});

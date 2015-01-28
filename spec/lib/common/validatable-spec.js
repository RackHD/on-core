// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

var util = require('util');

describe('Validatable', function () {
    var Validatable, Subject;

    helper.before();

    before(function () {
        Validatable = helper.injector.get('Validatable');
    });

    helper.after();

    describe('validated', function () {
        describe('type', function () {
            before(function () {
                Subject = function (defaults) {
                    Validatable.call(
                        this,
                        {
                            name: {
                                type: 'string'
                            }
                        }
                    );

                    _.defaults(this, defaults);
                };

                util.inherits(Subject, Validatable);
            });

            it('should resolve on success', function () {
                return new Subject({ name: 'test' }).validate().should.be.fulfilled;
            });

            it('should reject on failure', function () {
                return new Subject({ name: 1337 }).validate().should.be.rejected;
            });
        });

        describe('required', function () {
            before(function () {
                Subject = function (defaults) {
                    Validatable.call(
                        this,
                        {
                            name: {
                                required: true
                            }
                        }
                    );

                    _.defaults(this, defaults);
                };

                util.inherits(Subject, Validatable);
            });

            it('should resolve on success', function () {
                return new Subject({ name: 'test' }).validate().should.be.fulfilled;
            });

            it('should reject on failure', function () {
                return new Subject({ arbitrary: 1337 }).validate().should.be.rejected;
            });
        });

        describe('ipv4', function () {
            before(function () {
                Subject = function (defaults) {
                    Validatable.call(
                        this,
                        {
                            ip: {
                                ipv4: true
                            }
                        }
                    );

                    _.defaults(this, defaults);
                };

                util.inherits(Subject, Validatable);
            });

            it('should resolve ipv4', function () {
                return new Subject({ ip: '10.1.1.1' }).validate().should.be.fulfilled;
            });

            it('should reject non-ipv4', function () {
                return new Subject({ ip: 'garbage' }).validate().should.be.rejected;
            });
        });
    });
});
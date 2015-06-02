// Copyright (c) 2015, EMC Corporation


'use strict';

var util = require('util');

describe('Validatable', function () {
    var Validatable, Subject, Errors;

    helper.before();

    before(function () {
        Validatable = helper.injector.get('Validatable');
        Errors = helper.injector.get('Errors');
    });

    helper.after();

    describe('validated', function () {
        describe('type', function () {
            before(function () {
                Subject = function (defaults) {
                    Validatable.call(
                        this,
                        {
                            id: 'Subject',
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string'
                                }
                            }
                        }
                    );

                    _.defaults(this, defaults);
                };

                util.inherits(Subject, Validatable);
            });

            it('should resolve on success', function () {
                return new Subject({ name: 'test' }).validate();
            });

            it('should reject on failure', function () {
                return new Subject(
                    { name: 1337 }
                ).validate().should.be.rejectedWith(Errors.SchemaError);
            });
        });

        describe('required', function () {
            before(function () {
                Subject = function (defaults) {
                    Validatable.call(
                        this,
                        {
                            id: 'Subject',
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string'
                                }
                            },
                            required: [ 'name' ]
                        }
                    );

                    _.defaults(this, defaults);
                };

                util.inherits(Subject, Validatable);
            });

            it('should resolve on success', function () {
                return new Subject({ name: 'test' }).validate();
            });

            it('should reject on failure', function () {
                return new Subject(
                    { arbitrary: 1337 }
                ).validate().should.be.rejectedWith(Errors.SchemaError);
            });
        });

        describe('ipv4', function () {
            before(function () {
                Subject = function (defaults) {
                    Validatable.call(
                        this,
                        {
                            id: 'Subject',
                            type: 'object',
                            properties: {
                                ip: {
                                    type: 'string',
                                    format: 'ipv4'
                                }
                            }
                        }
                    );

                    _.defaults(this, defaults);
                };

                util.inherits(Subject, Validatable);
            });

            it('should resolve ipv4', function () {
                return new Subject({ ip: '10.1.1.1' }).validate();
            });

            it('should reject non-ipv4', function () {
                return new Subject(
                    { ip: 'garbage' }
                ).validate().should.be.rejectedWith(Errors.SchemaError);
            });
        });
    });
});

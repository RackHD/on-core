// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');

describe('Models.Log', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').logs;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('creation', function() {
        it('should create a log event', function() {
            return this.model.create({
                node: "54d93422b492491333333333",
                level: 'info',
                message: 'hello',
                trace: '00000000-0000-4000-8000-000000000000',
                timestamp: new Date(),
                caller: 'dummy',
                subject: 'dummy',
                host: 'dummy'
            });
        });

        it('should create a log event with context', function() {
            return this.model.create({
                node: "54d93422b492491333333333",
                level: 'info',
                message: 'hello',
                trace: '00000000-0000-4000-8000-000000000000',
                timestamp: new Date(),
                caller: 'dummy',
                subject: 'dummy',
                host: 'dummy',
                context: {
                    data: {
                        key1: 'valuevalue',
                        array1: [
                            {
                                key2: 'value3'
                            }
                        ]
                    }
                }
            });
        });

        it('should replace dots in log context keys with underscores', function() {
            return this.model.create({
                node: "54d93422b492491333333333",
                level: 'info',
                message: 'hello',
                trace: '00000000-0000-4000-8000-000000000000',
                timestamp: new Date(),
                caller: 'dummy',
                subject: 'dummy',
                host: 'dummy',
                context: {
                    data: {
                        'testkey1.test': 'value1'
                    }
                }
            }).then(function (logEvent) {
                /*jshint sub: true */
                expect(logEvent.context.data['testkey1_test']).to.equal('value1');
            });
        });

        it('should replace dollar signs in log keys with underscores', function() {
            return this.model.create({
                node: "54d93422b492491333333333",
                level: 'info',
                message: 'hello',
                trace: '00000000-0000-4000-8000-000000000000',
                timestamp: new Date(),
                caller: 'dummy',
                subject: 'dummy',
                host: 'dummy',
                context: {
                    data: {
                        'testkey1$test': 'value1'
                    }
                }
            }).then(function (logEvent) {
                /*jshint sub: true */
                expect(logEvent.context.data['testkey1_test']).to.equal('value1');
            });
        });
    });
});


// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

var di = require('di');

describe('Logger', function () {
    var Logger, events;

    helper.before();

    before(function () {
        Logger = helper.injector.get('Logger');
        events = helper.injector.get('Events');
    });

    helper.after();

    describe('Constructor', function () {
        it('should be a Logger', function () {
            expect(Logger.name).to.be.equal('Logger');
        });

        it('should assign module based on the provided string', function () {
            var logger = new Logger('module');

            expect(logger.module).to.equal('module');
        });

        it('should assign a default module if none is provided', function () {
            var logger = new Logger();

            expect(logger.module).to.equal('No Module');
        });

        it('should use dependency injection provides if available', function () {
            function Test () {}

            di.annotate(Test, new di.Provide('ProvidedByTest'));

            var logger = new Logger(Test);

            expect(logger.module).to.equal('ProvidedByTest');
        });

        it('should use the function name if provides is not available', function () {
            function Test () {}

            var logger = new Logger(Test);

            expect(logger.module).to.equal('Test');
        });
    });

    describe('Class Methods', function () {
        describe('initialize', function () {
            it('should exist', function () {
                expect(Logger.initialize).to.be.a('function');
            });

            it('should return a Logger instance', function () {
                expect(Logger.initialize()).to.be.an.instanceof(Logger);
            });
        });
    });

    describe('Instance Methods', function () {
        before(function () {
            this.subject = new Logger('Test');
        });

        [
            'emerg',
            'alert',
            'crit',
            'error',
            'warning',
            'notice',
            'info',
            'debug',
            'silly'
        ].forEach(function (level) {
            describe(level, function () {
                before(function () {
                    sinon.spy(events, 'emit');
                });

                afterEach(function () {
                    events.emit.reset();
                });

                after(function () {
                    events.emit.restore();
                });

                it('should be a function', function () {
                    expect(this.subject).to.respondTo(level);
                });

                it('should have 2 arguments', function () {
                    expect(this.subject).to.have.property(level).with.length(2);
                });

                it('should emit to the shared events object', function (done) {
                    this.subject[level]('message ' + level);

                    setImmediate(function () {
                        expect(
                            events.emit
                        ).to.have.been.calledWith('log');

                       done();
                    });
                });
            });
        });

        it('log method should be a function', function () {
            expect(this.subject).to.respondTo('log');
        });

        it('log method should have 3 arguments', function () {
            expect(this.subject).to.have.property('log').with.length(3);
        });
    });
});


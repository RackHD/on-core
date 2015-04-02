// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Connection', function () {
    var Connection;

    helper.before();

    before(function () {
        Connection = helper.injector.get('Connection');
        this.uri  = helper.injector.get('Services.Configuration').get('amqp');
    });

    beforeEach(function () {
        this.subject = new Connection({
            uri: this.uri
        });
    });

    afterEach(function () {
        if (this.connection && this.connection.connected) {
            return this.connection.stop();
        }
    });

    helper.after();

    describe('Connection', function () {
        describe('start', function () {
            it('should fulfill on success', function () {
                return this.subject.start();
            });

            it('should reject if started twice', function () {
                var self = this;

                return this.subject.start().then(function () {
                    return self.subject.start().should.be.rejected;
                });
            });
        });

        describe('connected', function () {
            it('should be false if not connected', function () {
                this.subject.connected.should.equal(false);
            });

            it('should be true if connected', function () {
                var self = this;

                return this.subject.start().then(function () {
                    return self.subject.connected.should.equal(true);
                });
            });
        });

        describe('exchanges', function () {
            it('should be undefined if not connected', function () {
                expect(this.subject.exchanges).equal(undefined);
            });

            it('should have exchanges if connected', function () {
                var self = this;

                this.subject.start().then(function () {
                    self.subject.exchanges.should.not.be.undefined;
                });
            });
        });

        describe('stop', function () {
            it('should fulfill on success', function () {
                var self = this;

                return this.subject.start().then(function () {
                    return self.subject.stop();
                });
            });

            it('should reject if not running', function () {
                return this.subject.stop().should.be.rejected;
            });
        });

        describe('errors', function() {
            it('should emit errors from the underlying connection', function(done) {
                var self = this;

                this.subject.once('error', function (error) {
                    try {
                        error.should.be.an.instanceof(Error);
                        error.message.should.be.equal('Fake');
                        done();
                    } catch(e) {
                        done(e);
                    }
                });

                return this.subject.start().then(function () {
                    self.subject.connection.emit('error', new Error('Fake'));
                });
            });

            it('should not emit ECONNRESET errors from the underlying connection', function(done) {
                var self = this;

                this.subject.once('error', function (error) {
                    try {
                        error.should.be.an.instanceof(Error);
                        error.message.should.be.equal('Fake');
                        done();
                    } catch(e) {
                        done(e);
                    }
                });

                return this.subject.start().then(function () {
                    var error = new Error();
                    error.code = 'ECONNRESET';

                    self.subject.connection.emit('error', error);
                    self.subject.connection.emit('error', new Error('Fake'));
                });
            });
        });
    });
});

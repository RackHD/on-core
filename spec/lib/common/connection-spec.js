// Copyright 2015, EMC, Inc.


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
            url: this.uri
        }, {}, 'test');
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

            it('should reject on max retry attempts', function() {
                this.subject.maxConnectionRetries = 3;
                var startPromise = this.subject.start();
                this.subject.connection.removeAllListeners('ready');
                this.subject.connection.emit('error', new Error('test'));
                this.subject.connection.emit('error', new Error('test'));
                this.subject.connection.emit('error', new Error('test'));
                this.subject.connection.emit('error', new Error('test'));
                return expect(startPromise).to.be.rejectedWith(/Exceeded max retries/);
            });

            it('should increment retry attempts if initial connection fails', function() {
                this.subject.initialConnection = false;
                this.subject.start();
                this.subject.connection.removeAllListeners('ready');
                this.subject.connection.emit('error', new Error('test'));
                this.subject.connection.emit('error', new Error('test'));
                this.subject.connection.emit('error', new Error('test'));
                expect(this.subject.initialConnectionRetries).to.equal(3);
            });

            it('should not increment retry attempts if initial connection succeeded', function() {
                this.subject.initialConnection = true;
                this.subject.start();
                this.subject.connection.removeAllListeners('ready');
                this.subject.connection.emit('error', new Error('test'));
                this.subject.connection.emit('error', new Error('test'));
                expect(this.subject.initialConnectionRetries).to.equal(0);
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
    });
});

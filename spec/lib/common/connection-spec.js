
// Copyright 2015, EMC, Inc.


'use strict';

describe('Connection', function () {
    var Connection;
    var amqp, sandbox = sinon.sandbox.create();

    helper.before(function(context) {
        context.Core = {
            start: sandbox.stub().resolves(),
            stop: sandbox.stub().resolves()
        };

        context.amqp = function() {
            this.createConnection = sandbox.stub();
        };

        return [
            helper.di.simpleWrapper(context.Core, 'Services.Core' ),
            helper.di.simpleWrapper(context.amqp, 'amqp' )
        ];
    });

    before(function () {
        Connection = helper.injector.get('Connection');
        amqp = helper.injector.get('amqp');
    });

    beforeEach(function() {
        this.subject = new Connection({url: ''}, {}, 'test');
    });

    helper.after(function() {
        sandbox.restore();
    });

    describe('Connection', function () {
        describe('start', function () {

            it('should fulfill on success', function () {
                amqp.createConnection = sandbox.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            if (a === 'ready') {
                                callback(null, {});
                            }
                        }
                    });
                });
                return this.subject.start();
            });

            it('should reject on trying to start twice', function () {
                amqp.createConnection = sandbox.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            callback(null, {});
                        }
                    });
                });
                var self = this;
                return this.subject.start().then(function () {
                    return self.subject.start().should.be.rejected;
                });
            });

            it('should suppress Error Code ECONNRESET', function () {
                amqp.createConnection = sandbox.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            callback({'code': 'ECONNRESET'}, {});
                        }
                    });
                });
                return this.subject.start();
            });

            it('should check if initialConnection is true', function () {
                this.subject.initialConnection = {};
                amqp.createConnection = sandbox.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            callback({'message': 'Hit an error'}, {});
                        }
                    });
                });
                return this.subject.start();
            });

            it('should check if max retries exceeded', function () {
                this.subject.initialConnectionRetries = 100;
                amqp.createConnection = sandbox.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            if (a === 'error') {
                                callback({'message': 'error'}, {});
                            }
                        }
                    });
                });
                return expect(this.subject.start()).to.be.rejectedWith(Error);
            });

            describe('connected', function () {
                it('should be false if not connected', function () {
                    this.subject.connected.should.equal(false);
                });

                it('should be true if connected', function () {
                    var self = this;
                    amqp.createConnection = sandbox.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            }
                        });
                    });
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

                    amqp.createConnection = sandbox.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            },
                            'exchanges':
                                'on.test'
                        });
                    });
                    return this.subject.start().then(function () {
                        self.subject.exchanges.should.not.be.undefined;
                    });
                });
            });

            describe('exchange', function ()  {
                it('should not provide an exchange if connection not established ', function () {
                    return expect(this.subject.exchange()).to.be.rejectedWith(Error);
                });

                it('should publish exchange if name is present ', function () {
                    var self = this;
                    amqp.createConnection = sandbox.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            },
                            'exchange': function (a, b, callback){
                                callback('exchange', {});
                            },
                            'exchanges':
                                'on.test'
                        });
                    });
                    return this.subject.start().then(function () {
                        expect(self.subject.connected).to.equal(true);
                        {
                            var name = 2;
                            return expect(self.subject.exchange(name)).to.be.ok;
                        }
                    });
                });

                it('should publish default exchange if name is not present ', function () {
                    var self = this;
                    amqp.createConnection = sandbox.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            },
                            'exchange': function (){
                            },
                            'exchanges':
                                'on.test'
                        });
                    });
                    return this.subject.start().then(function () {
                        expect(self.subject.connected).to.equal(true);
                        {
                            return expect(self.subject.exchange()).to.be.ok;
                        }
                    });
                });

                it('should provide an exchange if connection established and options ' +
                    'is a valid object', function () {
                    var self = this;
                    amqp.createConnection = sandbox.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            },
                            'exchange': function (a, b, callback){
                                callback('Hello');
                            },
                            'exchanges':
                                'on.test'
                        });
                    });
                    return this.subject.start().then(function () {
                        expect(self.subject.connected).to.equal(true);
                          return self.subject.exchange('amqp', {url: ''}).should.become('Hello');
                    });
                });

                it('should error out if objects is not valid ', function () {
                    var self = this;
                    amqp.createConnection = sandbox.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            },
                            'exchange': function (a, b, callback){
                                callback('Hello', {});
                            },
                            'exchanges':
                                'on.test'
                        });
                    });
                    return this.subject.start().then(function () {
                        if(self.subject.connected === true) {
                            return expect(self.subject.exchange('amqp')).to.be.rejectedWith(Error);
                        }
                    });
                });
            });

            describe('queue', function() {
                it('should provide a queue', function () {
                    var self = this;
                    amqp.createConnection = sandbox.spy(function () {
                        return ({
                            'queue': function (a, b, callback) {
                                callback;
                            },
                                'on': function (a, callback) {
                                    callback(null, {});
                            }
                        });
                    });
                        return this.subject.start().then(function () {
                            return self.subject.queue('amqp', {url: ''});
                        });
                });
            });

            describe('stop', function () {
                it('should close connection if on', function () {
                    var self = this;
                    amqp.createConnection = sandbox.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                if(a==='ready' || a=== 'close')
                                {
                                    callback(null, {});
                                }
                            }
                        });
                    });
                    return this.subject.start().then(function () {
                        return expect(self.subject.stop()).to.be.fulfilled;
                    });
                });

                it('should disconnect connection', function (done) {
                    var self = this;
                    amqp.createConnection = sandbox.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                if(a === 'ready'){
                                    callback(null, {});
                                }
                            },
                            'disconnect':function(){done();},
                        });
                    });
                    this.subject.start().then(function () {
                        return expect(self.subject.stop()).to.be.fulfilled;
                    })
                    .then(done());
                });

                it('should reject if not connected', function () {
                    return this.subject.stop().should.be.rejected;
                });
            });
        });
    });
});

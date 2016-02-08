
// Copyright 2015, EMC, Inc.


'use strict';

describe('Connection', function () {
    var Connection;
    var amqp, amqpConnection;
    helper.before();

    before(function () {
        Connection = helper.injector.get('Connection');
        amqp = helper.injector.get('amqp');
    });
    this.uri = 'amqp://localhost';
    beforeEach(function () {
        this.subject = new Connection({url: 'amqp://localhost'}, {}, 'test');

    });

    helper.after();

    describe('Connection', function () {
        describe('start', function () {

            it('should fulfill on success', function () {
                amqp.createConnection = sinon.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            if (a === 'ready') {
                                callback(null, {});
                            }
                        }
                    })
                })
                return this.subject.start();
            });

            it('should reject on trying to start twice', function () {
                amqp.createConnection = sinon.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            callback(null, {});
                        }
                    })
                })
                var self = this;
                return this.subject.start().then(function () {
                    return self.subject.start().should.be.rejected;
                });
            });

            it('should suppress Error Code ECONNRESET', function () {
                amqp.createConnection = sinon.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            callback({'code': 'ECONNRESET'}, {});
                        }
                    })
                });
                return this.subject.start();
            });

            it('should check if initialConnection is true', function () {
                this.subject.initialConnection = {};
                amqp.createConnection = sinon.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            callback({'message': 'Hit an error'}, {});
                        }
                    })
                })
                return this.subject.start();
            });

            it('should check if max retries exceeded', function () {
                this.subject.initialConnectionRetries = 100;
                amqp.createConnection = sinon.spy(function () {
                    return ({
                        'on': function (a, callback) {
                            if (a === 'error') {
                                callback({'message': 'error'}, {});
                            }
                        }
                    })
                })
                return this.subject.start()
                    .catch(function (Error) {
                        console.log(Error);
                    });
            });

            describe('connected', function () {
                it('should be false if not connected', function () {
                    this.subject.connected.should.equal(false);
                });

                it('should be true if connected', function () {
                    var self = this;
                    amqp.createConnection = sinon.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            }
                        })
                    })
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

                    amqp.createConnection = sinon.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            },
                            'exchanges':
                                'on.test'
                        })
                    })
                    this.subject.start().then(function () {

                        self.subject.exchanges.should.not.be.undefined;
                    });
                });
            });

            describe('exchange', function ()  {
                it('should not provide an exchange if connection not established ', function () {
                    var self = this;
                    return this.subject.exchange()
                        .catch(function (Error) {
                            console.log(Error);
                        });
                });

                it('should provide an exchange if connection established and options is a valid object', function () {
                    var self = this;
                    amqp.createConnection = sinon.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            },
                            'exchange': function (a, b, callback){
                                callback('Hello', {})
                            },
                            'exchanges':
                                'on.test'
                        })
                    })
                    this.subject.start().then(function () {
                        if (self.subject.connected == true) {
                            var name = 'amqp://localhost';
                            return self.subject.exchange(name, {url: 'amqp://localhost'}, function(callback) {
                                callback('exchange', {});
                            });
                        }
                    });
                });

                it('should error out if objects is not valid ', function () {
                    var self = this;
                    amqp.createConnection = sinon.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            },
                            'exchange': function (a, b, callback){
                                callback('Hello', {})
                            },
                            'exchanges':
                                'on.test'
                        })
                    })
                    this.subject.start().then(function () {
                        if (self.subject.connected == true) {
                            var name = 'test';
                            return self.subject.exchange(name)
                                .catch(function (Error) {
                                    console.log(Error);
                                });
                        }
                    });
                });

                it('should publish exchange if name is present ', function () {
                    var self = this;
                    amqp.createConnection = sinon.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                callback(null, {});
                            },
                            'exchange': function (a, b, callback){
                                callback('exchange', {})
                            },
                            'exchanges':
                                'on.test'
                        })
                    })
                    this.subject.start().then(function () {
                        if (self.subject.connected == true) {
                            var name = 2;
                            return self.subject.exchange(name)
                            callback('exchange', {});
                        }
                    });
                });
            });

            describe('stop', function () {
                it('should close connection if on', function () {
                    var self = this;
                    amqp.createConnection = sinon.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                if(a==='ready' || a=== 'close')
                                    callback(null, {});
                            }
                        })
                    })
                    return this.subject.start().then(function () {
                        return self.subject.stop();
                    });
                });

                it('should disconnect connection', function (done) {
                    var self = this;
                    amqp.createConnection = sinon.spy(function () {
                        return ({
                            'on': function (a, callback) {
                                if(a === 'ready'){
                                    callback(null, {});
                                }
                            },
                            'disconnect':function(){done();}
                        })
                    })
                    return this.subject.start().then(function () {
                        return self.subject.stop();
                    });
                });

                it('should reject if not connected', function () {
                    return this.subject.stop().should.be.rejected;
                });
            });
        });
    });
});
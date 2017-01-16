// Copyright 2015, EMC, Inc.


'use strict';

describe('Messenger', function () {
    var Errors, ErrorEvent, IpAddress, Constants,
        testData = { hello: 'world' },
        sandbox = sinon.sandbox.create();
    
    helper.before(function(context) {
        function MockPromise () {
            this.addCallback = sandbox.spy(function(callback) {
                callback({});
            });
        }
        
        var exchange = {
            publish: sandbox.stub().resolves()
        };
        
        var queue = {
            subscribe: sandbox.spy(function(a,callback) {
                callback(testData,{},{});
                return new MockPromise();
            }),
            bind: sandbox.spy(function(a,b,callback) {
                callback();
            })
        };
        
        context.statsd = {
            stop: sandbox.stub().resolves(),
            start: sandbox.stub().resolves(),
            sanitize: sandbox.stub().resolves(),
            timing: sandbox.stub().resolves()
        };
        
        context.Subscription = function () {
            this.dispose = sandbox.stub();
        };
        
        context.Connection = function () {
            this.start = sandbox.stub().resolves();
            this.stop = sandbox.stub().resolves();
            this.exchange = sandbox.stub().resolves(exchange);
            this.queue = sandbox.spy(function(a,b,callback) {
                callback(queue);
            });
            this.exchanges = {'on.test':{}};
            this.initialConnection = true;
        };
        
        context.Message = function (data) {
            this.data = data;
            this.resolve = sandbox.stub().resolves();
            this.respond = sandbox.stub().resolves();
            this.isRequest = sandbox.stub().resolves();
            this.reject = sandbox.stub().resolves();
        };
        
        context.Timer = function () {
            this.stop = sandbox.stub().resolves();
            this.start = sandbox.stub().resolves();
        };
        
        context.Core = {
            start: sandbox.stub().resolves(),
            stop: sandbox.stub().resolves()
        };
        
        return [
            helper.di.simpleWrapper(context.Message, 'Message'),
            helper.di.simpleWrapper(context.Connection, 'Connection'),
            helper.di.simpleWrapper(context.Timer, 'Timer'),
            helper.di.simpleWrapper(context.statsd, 'Services.StatsD'),
            helper.di.simpleWrapper(context.Subscription, 'Subscription'),
            helper.di.simpleWrapper(context.Core, 'Services.Core' )
        ];
    });
    

    before(function () {
        this.subject = helper.injector.get('Services.Messenger');
        Errors = helper.injector.get('Errors');
        ErrorEvent = helper.injector.get('ErrorEvent');
        IpAddress = helper.injector.get('IpAddress');
        Constants = helper.injector.get('Constants');
    });
    
    helper.after();
    after(function() {
        sandbox.restore();
    });
    
    beforeEach(function() {
        this.subject.start();
    });
    
    afterEach(function() {
        this.subject.stop();
    });
    
    describe('publish/subscribe', function () {
        it('should resolve if the published data is an object', function () {
            return this.subject.publishInternalEvents(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                { hello: 'world' }
            ).should.be.fulfilled;
        });

        it('should reject if the published data is invalid', function () {
            return this.subject.publishInternalEvents(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                new IpAddress({ value: 'invalid' })
            ).should.be.rejected;
        });

        it('should resolve if the published data is valid', function () {
            return this.subject.publishInternalEvents(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                new IpAddress({ value: '10.1.1.1' })
            ).should.be.fulfilled;
        });

        it('should send data to the proper exchange', function () {
            var self = this;
            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                '#',
                function (data) {
                    data.should.deep.equal(
                        { hello: 'world' }
                    );
                }
            ).then(function (sub) {
                expect(sub).to.be.ok;
                return self.subject.publishInternalEvents(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { hello: 'world' }
                ).should.be.fulfilled;
            });
        });

        it('should send data to the proper routing key', function () {
            var self = this;
            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                function (data) {
                    data.should.deep.equal(
                        { hello: 'world' }
                    );
                }
            ).then(function () {
                return self.subject.publishInternalEvents(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { hello: 'world' }
                ).should.be.fulfilled;
            });
        });

        it('should reject if subscribed to an invalid exchange', function () {
            return this.subject.subscribe(
                'invalid',
                '#',
                function (){}
            ).should.be.rejectedWith(Error);
        });

        it('should throw if subscribed with an invalid type', function () {
            testData = { hello: 'world' };
            var self = this;
            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                function(){},
                function(){}
            ).then(function() {
                expect(self.subject.messenger.receive.queue).to.throw(Error);
            });
        });

        it('should reject if published to an invalid exchange', function () {
            return this.subject.publishInternalEvents(
                'invalid',
                'invalid',
                { hello: 'invalid' }
            ).should.be.rejectedWith(Error);
        });

        it('should reject if no transmit connection established', function () {
            this.subject.messenger.transmit = undefined;
            return this.subject.publishInternalEvents(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                { hello: 'world' }
            ).should.be.rejectedWith(Error);
        });
    });

    describe('request', function () {
        it('should resolve on a successful response', function () {
            testData = { hello: 'world' };
            var self = this;

            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                '#',
                function (data, message) {
                    data.should.deep.equal(testData);
                    message.resolve(testData);
                }
            ).then(function (sub) {
                return self.subject.request(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    testData
                ).should.eventually.deep.equal(testData);
            });
        });

        it('should reject on an unsuccessful response', function () {
            var self = this;
            testData = new ErrorEvent();
            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                '#',
                function (data, message) {
                    data.should.deep.equal({ hello: 'world' });
                    message.reject(testData);
                }
            ).then(function (sub) {
                return self.subject.request(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { hello: 'world' }
                ).should.be.rejectedWith(ErrorEvent);
            });
        });

        it('should reject if a request times out', function () {
            this.subject.timeout = 0;
            return this.subject.request(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { hello: 'world' }
                ).should.be.rejectedWith(Errors.RequestTimedOutError());
        });

        it('should reject request messages which are not what the subscriber expects', function () {
            var self = this;
            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                '#',
                function () {
                    throw new Error('Should Never Get Here');
                },
                IpAddress
            ).then(function (sub) {
                return self.subject.request(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { value: 'invalid' }
                ).should.be.rejectedWith(ErrorEvent);
            });
        });

        it('should reject response messages which are not what the requester expects', function () {
            var self = this;
                testData = { hello: 'world' };
            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                '#',
                function (data, message) {
                    message.resolve(testData);
                }
            ).then(function (sub) {
                return self.subject.request(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { value: 'invalid' },
                    IpAddress
                ).should.be.rejectedWith(Error);
            });
        });
    
        it('should only call subscription.dispose once', function (done) {
            var self = this;
            var mockOptions = {};
            var Timer = helper.injector.get('Timer');
            var Subscription = helper.injector.get('Subscription');
            var mockContext = {
                subscription: null,
                timeout: null,
                name: Constants.Protocol.Exchanges.Test.Name,
                routingKey: 'test',
                data: {hello: 'world'},
                type: null,
                timer: new Timer(),
                queue: {name: 'qname'},
                resolve: function() {},
                reject: function() {}
            };

            self.subject.timeout = 0;
            var stub = sinon.spy(function() {this._disposed = true;});
            Subscription.create = function () {
                return {    
                    dispose: stub, 
                   _disposed: false
                };
            };
            self.subject.subscribeCallback(mockContext, mockOptions);
            setTimeout(function() {
                try {
                    stub;
                    self.subject.subscribeTimeout(mockContext, mockContext.data, {}, {});
                    expect(mockContext.subscription.dispose).to.have.been.calledOnce;
                    done();
                } catch (e) {
                    done(e);
                }
            }, 10);
        });
    });
});

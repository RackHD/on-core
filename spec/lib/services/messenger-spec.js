// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Messenger', function () {
    var subscription, ErrorEvent, IpAddress, tracer, Constants;

    helper.before();

    before(function () {
        this.subject = helper.injector.get('Services.Messenger');
        ErrorEvent = helper.injector.get('ErrorEvent');
        IpAddress = helper.injector.get('IpAddress');
        tracer = helper.injector.get('Tracer');
        Constants = helper.injector.get('Constants');
    });

    afterEach(function () {
        if (subscription) {
            return subscription.dispose().then(function () {
                subscription = undefined;
            }).catch(function () {
                subscription = undefined;
            });
        }
    });

    helper.after();

    describe('publish/subscribe', function () {
        it('should resolve if the published data is an object', function () {
            return this.subject.publish(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                { hello: 'world' }
            ).should.be.fulfilled;
        });

        it('should reject if the published data is invalid', function () {
            return this.subject.publish(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                new IpAddress({ value: 'invalid' })
            ).should.be.rejected;
        });

        it('should resolve if the published data is valid', function () {
            return this.subject.publish(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                new IpAddress({ value: '10.1.1.1' })
            ).should.be.fulfilled;
        });

        it('should send data to the proper exchange', function (done) {
            var self = this;

            this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                '#',
                function (data) {
                    data.should.deep.equal({ hello: 'world' });

                    done();
                }
            ).then(function (sub) {
                subscription = sub;

                return self.subject.publish(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { hello: 'world' }
                );
            }).catch(function (error) {
                done(error);
            });
        });

        it('should send data to the proper routing key', function (done) {
            var self = this;

            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                'test',
                function (data) {
                    data.should.deep.equal(
                        { hello: 'world' }
                    );

                    done();
                }
            ).then(function (sub) {
                subscription = sub;

                return self.subject.publish(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { hello: 'world' }
                );
            }).catch(function (error) {
                done(error);
            });
        });

        it('should reject if subscribed to an invalid exchange', function () {
            return this.subject.subscribe(
                'invalid',
                '#',
                function (){}
            ).should.be.rejectedWith(Error);
        });

        it('should reject if published to an invalid exchange', function () {
            return this.subject.publish(
                'invalid',
                'invalid',
                { hello: 'invalid' }
            ).should.be.rejectedWith(Error);
        });
    });

    describe('request', function () {
        it('should resolve on a successful response', function () {
            var self = this;

            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                '#',
                function (data, message) {
                    data.should.deep.equal({ hello: 'world' });

                    message.resolve(
                        { world: 'hello' }
                    );
                }
            ).then(function (sub) {
                subscription = sub;

                return self.subject.request(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { hello: 'world' }
                ).should.eventually.deep.equal({ world: 'hello' });
            });
        });

        it('should reject on an unsuccessful response', function () {
            var self = this;

            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                '#',
                function (data, message) {
                    data.should.deep.equal({ hello: 'world' });

                    message.reject(
                        new Error('world hello')
                    );
                }
            ).then(function (sub) {
                subscription = sub;

                return self.subject.request(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { hello: 'world' }
                ).should.be.rejectedWith(ErrorEvent);
            });
        });

        it('should reject if a request times out', function () {
            this.subject.timeout = 100;

            return this.subject.request(
                    'test',
                    'test',
                    { hello: 'world' }
                ).should.be.rejectedWith(Error);
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
                subscription = sub;

                return self.subject.request(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { value: 'invalid' }
                ).should.be.rejectedWith(ErrorEvent);
            });
        });

        it('should reject response messages which are not what the requester expects', function () {
            var self = this;

            return this.subject.subscribe(
                Constants.Protocol.Exchanges.Test.Name,
                '#',
                function (data, message) {
                    message.resolve({ hello: 'world' });
                }
            ).then(function (sub) {
                subscription = sub;

                return self.subject.request(
                    Constants.Protocol.Exchanges.Test.Name,
                    'test',
                    { value: 'invalid' },
                    IpAddress
                ).should.be.rejectedWith(Error);
            });
        });
    });
});
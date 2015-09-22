// Copyright 2015, EMC, Inc.


'use strict';

describe('Message', function () {
    var Message, ErrorEvent, IpAddress;

    helper.before(function (context) {
        function Subscription () {
            this.dispose = sinon.stub();
        }

        context.messenger = {
            start: sinon.stub().returns(
                Promise.resolve()
            ),
            stop: sinon.stub().returns(
                Promise.resolve()
            ),
            subscribe: sinon.stub().returns(
                Promise.resolve(
                    new Subscription()
                )
            ),
            publish: sinon.stub().returns(
                Promise.resolve()
            )
        };

        return helper.di.simpleWrapper(context.messenger, 'Services.Messenger');
    });

    before(function () {
        Message = helper.injector.get('Message');
        ErrorEvent = helper.injector.get('ErrorEvent');
        IpAddress = helper.injector.get('IpAddress');

        this.data = { hello: 'world' };
        this.headers = {};
        this.deliveryInfo = {
            correlationId: 'correlationId',
            type: 'type',
            headers: {
                key: 'value'
            },
            replyTo: 'replyTo',
            exchange: 'exchange',
            routingKey: 'routingKey',
            consumerTag: 'consumerTag'
        };

        this.subject = new Message(this.data, this.headers, this.deliveryInfo);
    });

    helper.after();

    describe('constructor', function () {
        describe('factory', function () {
            before(function () {
                this.subject = { value: '10.1.1.1' };
            });

            it('should use type if provided', function () {
                Message.factory(this.subject, 'IpAddress').should.be.an.instanceof(IpAddress);
            });

            it('should default to object if type not provided', function () {
                Message.factory(this.subject).should.be.an.instanceof(Object);
            });

            it('should default to object if the type is not found', function () {
                Message.factory(this.subject, 'NotFound').should.be.an.instanceof(Object);
            });
        });
    });

    describe('respond', function () {
        it('should call messenger.publish', function () {
            var self = this,
                message = { response: 'message' };

            return this.subject.respond(message).then(function () {
                self.messenger.publish.should.have.been.calledWith(
                    '',
                    'replyTo',
                    message
                );
            });
        });
    });

    describe('resolve', function () {
        it('should call messenger.respond', function () {
            var self = this,
                message = { response: 'message' };

            return this.subject.resolve(message).then(function () {
                self.messenger.publish.should.have.been.calledWith(
                    '',
                    'replyTo',
                    message
                );
            });
        });
    });

    describe('reject', function () {
        it('should call messenger.respond with an ErrorEvent', function () {
            var self = this,
                error = new Error('hello world');

            return this.subject.reject(error).then(function () {
                self.messenger.publish.should.have.been.calledWith(
                    '',
                    'replyTo',
                    new ErrorEvent(error)
                );
            });
        });
    });
});

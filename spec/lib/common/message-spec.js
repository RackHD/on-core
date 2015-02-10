// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Message', function () {
    var Message, ErrorEvent, IpAddress;

    helper.before(function (context) {
        function Subscription () {
            this.dispose = sinon.stub();
        }

        context.messenger = {
            start: sinon.stub().returns(
                Q.resolve()
            ),
            stop: sinon.stub().returns(
                Q.resolve()
            ),
            subscribe: sinon.stub().returns(
                Q.resolve(
                    new Subscription()
                )
            ),
            respond: sinon.stub().returns(
                Q.resolve()
            )
        };

        return helper.di.simpleWrapper(context.messenger, 'Services.Messenger');
    });

    before(function () {
        Message = helper.injector.get('Message');
        ErrorEvent = helper.injector.get('ErrorEvent');
        IpAddress = helper.injector.get('IpAddress');

        this.data = {
            content: '{ "hello": "world" }',
            properties: {
                correlationId: 'correlationId',
                type: 'type',
                headers: {
                    key: 'value'
                },
                replyTo: 'replyTo'
            },
            fields: {
                exchange: 'exchange',
                routingKey: 'routingKey',
                consumerTag: 'consumerTag'
            }
        };

        this.subject = new Message(this.data);
    });

    helper.after();



    describe('constructor', function () {
        it('assigns data.properities to properties', function () {
            this.subject.properties.should.deep.equal(this.data.properties);
        });

        it('assigns data.fields to fields', function () {
            this.subject.fields.should.deep.equal(this.data.fields);
        });

        it('deserializes data.content to data as JSON', function () {
            this.subject.data.should.deep.equal({ hello: 'world' });
        });

        [
            'exchange',
            'routingKey',
            'consumerTag',
            'correlationId',
            'type',
            'replyTo'
        ].forEach(function (property) {
            it ('provides a ' + property + ' accessor', function () {
                this.subject[property].should.equal(property);
            });
        });

        it('provides a headers property accessor', function () {
            this.subject.headers.should.deep.equal(this.data.properties.headers);
        });

        describe('deserialize', function () {
            before(function () {
                this.json = '{ "value": "10.1.1.1" }';
            });

            it('should use type if provided', function () {
                Message.deserialize(this.json, 'IpAddress').should.be.an.instanceof(IpAddress);
            });

            it('should default to object if type not provided', function () {
                Message.deserialize(this.json).should.be.an.instanceof(Object);
            });

            it('should default to object if the type is not found', function () {
                Message.deserialize(this.json, 'NotFound').should.be.an.instanceof(Object);
            });
        });
    });

    describe('respond', function () {
        it('should call messenger.respond', function () {
            var self = this,
                message = { response: 'message' };

            return this.subject.respond(message).then(function () {
                self.messenger.respond.should.have.been.calledWith(
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
                self.messenger.respond.should.have.been.calledWith(
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
                self.messenger.respond.should.have.been.calledWith(
                    'replyTo',
                    new ErrorEvent(error)
                );
            });
        });
    });
});
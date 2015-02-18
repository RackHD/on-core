// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Messenger', function () {
    var subscription, ErrorEvent, tracer;

    helper.before();

    before(function () {
        this.subject = helper.injector.get('Services.Messenger');
        ErrorEvent = helper.injector.get('ErrorEvent');
        tracer = helper.injector.get('Tracer');

        return this.subject.exchange('test', 'topic');
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

    describe('start', function () {
        it('needs tests');
    });

    describe('stop', function () {
        it('needs tests');
    });

    describe('publish/subscribe', function () {
        it('should send data to the proper exchange', function (done) {
            var self = this;

            this.subject.subscribe(
                'test',
                '#',
                function (data) {
                    data.should.deep.equal({ hello: 'world' });

                    done();
                }
            ).then(function (sub) {
                subscription = sub;

                return self.subject.publish(
                    'test',
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
                'test',
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
                    'test',
                    'test',
                    { hello: 'world' }
                );
            }).catch(function (error) {
                done(error);
            });
        });

        it('should fulfill on successful publish', function (done) {
            var self = this;

            this.subject.subscribe(
                'test',
                '#',
                function (data) {
                    data.should.deep.equal({ hello: 'world' });

                    done();
                }
            ).then(function (sub) {
                subscription = sub;

                return self.subject.publish(
                    'test',
                    'test',
                    { hello: 'world' }
                ).should.be.fulfilled;
            }).catch(function (error) {
                done(error);
            });
        });

        it('should reject on failed publish');
        it('should provide tracer context to the subscriber');
    });

    describe('request', function () {
        it('should resolve on a successful response', function () {
            var self = this;

            return this.subject.subscribe(
                'test',
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
                    'test',
                    'test',
                    { hello: 'world' }
                ).should.eventually.deep.equal({ world: 'hello' });
            });
        });

        it('should reject on an unsuccessful response', function () {
            var self = this;

            return this.subject.subscribe(
                'test',
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
                    'test',
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
                ).should.be.rejectedWith(Error, 'Request Timed Out.');
        });

        it('should provide tracer context to the responder');
        it('should update the requester context with the responder changes');
    });
});
// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Subscription', function () {
    var Subscription;

    helper.before();

    before(function () {
        Subscription = helper.injector.get('Subscription');

        this.queue = {
            unsubscribe: sinon.spy(),
            destroy: sinon.spy(),
            close: sinon.spy()
        };

        this.options = {
            consumerTag: 'fake'
        };

        this.subject = new Subscription(
            this.queue,
            this.options
        );
    });

    helper.after();

    describe('constructor', function () {
        it('assigns queue to queue', function () {
            this.subject.queue.should.deep.equal(this.queue);
        });

        it('assigns options to options', function () {
            this.subject.options.should.deep.equal(this.options);
        });
    });

    describe('dispose', function () {
        it('should call queue.unsubscribe and queue.destroy', function () {
            var self = this;

            return this.subject.dispose().then(function () {
                self.queue.unsubscribe.should.have.been.calledWith('fake');
                self.queue.destroy.should.have.been.called;
                self.queue.close.should.have.been.called;
            });
        });
    });
});
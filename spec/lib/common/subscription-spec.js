// Copyright (c) 2015, EMC Corporation
/* jshint node:true */

'use strict';

describe('Subscription', function () {
    var Subscription;

    helper.before();

    before(function () {
        Subscription = helper.injector.get('Subscription');

        this.queue = {
            state: 'open',
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
        it('should unsubscribe the queue when the state is open', function () {
            var self = this;

            return this.subject.dispose().then(function () {
                self.queue.unsubscribe.should.have.been.calledWith('fake');
                self.queue.destroy.should.have.been.called;
                self.queue.close.should.have.been.called;
            });
        });

        it('should reject with an error if the queue is already unsubscribed', function () {
            this.subject.queue.state = 'closing';

            return this.subject.dispose().should.be.rejectedWith(
                Error,
                'Subscription Already Disposed.'
            );
        });
    });
});
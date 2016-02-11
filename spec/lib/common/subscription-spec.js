// Copyright 2015, EMC, Inc.


'use strict';
describe('Subscription', function () {
    var Subscription;
    var Logger;
    var sandbox = sinon.sandbox.create();

    helper.before(function (context) {
        context.MessengerServices = function() {
            this.start= sandbox.stub().resolves();
            this.stop = sandbox.stub().resolves();
            this.publish = sandbox.stub().resolves();
        };
        return [
            helper.di.simpleWrapper(context.MessengerServices, 'Messenger')
        ];
    });

    before(function () {
        Subscription = helper.injector.get('Subscription');

        Logger = helper.injector.get('Logger');

        Logger.prototype.log = sinon.spy();

            this.options = {
            consumerTag: 'fake'
        };
    });


    beforeEach(function() {
        this.queue = {
            state: 'open',
            unsubscribe: sinon.stub().resolves(),
            destroy: sinon.stub().resolves(),
            close: sinon.stub().resolves()
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

        it('should prevent closing the queue multiple times', function() {
            var self = this;
            return self.subject.dispose()
            .then(function() {
                return self.subject.dispose();
            })
            .then(function() {
                self.queue.unsubscribe.should.have.been.calledOnce;
                self.queue.destroy.should.have.been.calledOnce;
                self.queue.close.should.have.been.calledOnce;
            });
        });

        it('should retry closing the queue silently if it fails for the caller', function(done) {
            var self = this;
            sinon.spy(self.subject, 'dispose');
            self.subject.retryDelay = 0;
            self.subject.MAX_DISPOSE_RETRIES = 1;
            self.queue.unsubscribe.rejects(new Error('test error'));

            return expect(self.subject.dispose()).to.be.rejectedWith(/test error/)
            .then(function() {
                setTimeout(function() {
                    try {
                        expect(self.subject.dispose).to.have.been.calledTwice;
                        done();
                    } catch (e) {
                        done(e);
                    }
                }, 50);
            })
            .catch(function(err) {
                done(err);
            });
        });

        it('should reject with an error if the queue is already unsubscribed', function () {
             
            this.subject.queue.state = 'closing';

            return this.subject.dispose().should.be.rejectedWith(
                Error,
                'Attempted to dispose a subscription whose queue state is not open'
            );
        });
    });
});

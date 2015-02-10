// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Subscription', function () {
    var Subscription;
    
    helper.before();

    before(function () {
        Subscription = helper.injector.get('Subscription');

        this.messenger = {
            cancel: sinon.stub().returns(
                Q.resolve()
            ),
            deleteQueue: sinon.stub().returns(
                Q.resolve()
            )
        }

        this.subject = new Subscription(
            this.messenger,
            {
                consumerTag: 'consumerTag',
                queue: 'queue'
            }
        );
    })

    helper.after();

    describe('constructor', function () {
        it('assigns messenger to messenger', function () {
            this.subject.messenger.should.deep.equal(this.messenger);
        });

        it('assigns options to options', function () {
            this.subject.options.should.deep.equal({
                consumerTag: 'consumerTag',
                queue: 'queue'
            });
        });

        [
            'queue',
            'consumerTag'
        ].forEach(function (property) {
            it ('provides a ' + property + ' accessor', function () {
                this.subject[property].should.equal(property);
            });
        });
    });

    describe('dispose', function () {
        it('should call messenger.cancel and messenger.deleteQueue', function () {
            var self = this;

            return this.subject.dispose().then(function () {
                self.messenger.cancel.should.have.been.calledWith('consumerTag');
                self.messenger.deleteQueue.should.have.been.calledWith('queue');
            });
        });
    });
});
// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Subscription', function () {
    var Subscription;

    helper.before();

    before(function () {
        Subscription = helper.injector.get('Subscription');

        this.queue = {
            destroy: sinon.spy()
        };

        this.subject = new Subscription(
            this.queue
        );
    });

    helper.after();

    describe('constructor', function () {
        it('assigns queue to queue', function () {
            this.subject.queue.should.deep.equal(this.queue);
        });
    });

    describe('dispose', function () {
        it('should call messenger.cancel and messenger.deleteQueue', function () {
            var self = this;

            return this.subject.dispose().then(function () {
                return self.queue.destroy.should.have.been.calledWith;
            });
        });
    });
});
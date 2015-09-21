// Copyright 2015, EMC, Inc.

'use strict';

module.exports = PromiseQueueFactory;

PromiseQueueFactory.$provide = 'PromiseQueue';
PromiseQueueFactory.$inject = [
    'Assert',
    'EventEmitter',
    'Util',
    'Promise'
];

function PromiseQueueFactory(assert, EventEmitter, util, Promise) {
    function noop (timeout) {
        return Promise.delay(timeout);
    }

    function PromiseQueue(options) {
        EventEmitter.call(this);

        this.options = options || {};
        this.callbacks = [];
        this.running = false;
    }

    util.inherits(PromiseQueue, EventEmitter);

    PromiseQueue.prototype.enqueue = function (callback) {
        assert.func(callback);

        this.callbacks.push(callback);
    };

    PromiseQueue.prototype.dequeue = function () {
        return this.callbacks.shift();
    };

    PromiseQueue.prototype.start = function () {
        var self = this;

        if (!self.running) {
            self.running = true;

            setImmediate(self._process.bind(self));

            self.emit('started');
        }
    };

    PromiseQueue.prototype._process = function () {
        var self = this,
            callback = self.dequeue() || noop.bind(
                undefined, self.options.timeout || 100
            );

        Promise.resolve().then(function () {
            return callback();
        }).catch(function (error) {
            self.emit('error', error);
        }).finally(function () {
            if (self.running) {
                setImmediate(self._process.bind(self));
            } else {
                self.emit('stopped');
            }
        });
    };

    PromiseQueue.prototype.stop = function () {
        this.running = false;
        this.callbacks = [];
    };

    return PromiseQueue;
}

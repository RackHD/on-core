// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Protocol.Waterline', function() {
    var waterlineProtocol;
    var collection;
    var subscription;
    var Q;

    beforeEach(function() {
        return helper.start().then(function () {
            Q = helper.injector.get('Q');
            waterlineProtocol = helper.injector.get('Protocol.Waterline');
            collection = { identity: 'dummy' };
        });
    });

    afterEach(function () {
        if (subscription) {
            subscription.dispose();
            subscription = null;
        }
        return helper.stop();
    });

    it('should publish a created event', function() {
        waterlineProtocol.publishRecord(collection, 'created', { id: 1 });
    });

    it('should publish an updated event', function() {
        waterlineProtocol.publishRecord(collection, 'updated', { id: 1 });
    });

    it('should publish a destroyed event', function() {
        waterlineProtocol.publishRecord(collection, 'destroyed', { id: 1 });
    });

    it('should subscribe with an empty query', function () {
        return waterlineProtocol.subscribeToCollection(collection, {}, function () {})
        .then(function (_subscription) {
            subscription = _subscription;
        });
    });

    it('should subscribe with an id query', function () {
        return waterlineProtocol.subscribeToCollection(collection, { id: 1 }, function () {})
        .then(function (_subscription) {
            subscription = _subscription;
        });
    });

    it('should subscribe with a null query', function () {
        return waterlineProtocol.subscribeToCollection(collection, null, function () {})
        .then(function (_subscription) {
            subscription = _subscription;
        });
    });

    it('should subscribe with an undefined query', function () {
        return waterlineProtocol.subscribeToCollection(collection, undefined, function () {})
        .then(function (_subscription) {
            subscription = _subscription;
        });
    });

    describe('integrations', function () {
        function publishAndReceive(query, messages) {
            var deferred = Q.defer();
            var count = 0;
            if (!Array.isArray(messages)) {
                messages = Array.prototype.slice.call(arguments, 1);
            }
            return waterlineProtocol.subscribeToCollection(collection, query, function (message) {
                try {
                    expect(count).to.be.lessThan(messages.length);
                    if (typeof messages[count].assertions === 'function') {
                        messages[count].assertions(message);
                    }
                    count += 1;
                    if (count === messages.length) {
                        deferred.resolve();
                    }
                } catch (e) {
                    deferred.reject(e);
                }
            })
            .then(function (_subscription) {
                subscription = _subscription;
                messages.forEach(function (message) {
                    waterlineProtocol.publishRecord(collection, message.event, message.record);
                });
                return deferred.promise;
            });
        }

        it('should receive a created message', function () {
            return publishAndReceive({}, {
                event: 'created',
                record: { id: 1 },
                assertions: function (message) {
                    expect(message.event).to.equal('created');
                    expect(message.record).to.be.an('object');
                    expect(message.record.id).to.equal(1);
                }
            });
        });

        it('should receive updated messages', function () {
            return publishAndReceive({}, {
                event: 'updated',
                record: { id: 1 },
                assertions: function (message) {
                    expect(message.event).to.equal('created');
                    expect(message.record).to.be.an('object');
                    expect(message.record.id).to.equal(1);
                    expect(message.record.magic).to.not.be.defined;
                }
            },
            {
                event: 'updated',
                record: { id: 1, magic: 'test' },
                assertions: function (message) {
                    expect(message.event).to.equal('updated');
                    expect(message.record).to.be.an('object');
                    expect(message.record.id).to.equal(1);
                    expect(message.record.magic).to.equal('test');
                }
            });
        });

        it('should receive destroyed messages', function () {
            return publishAndReceive({}, {
                event: 'created',
                record: { id: 1 },
                assertions: function (message) {
                    expect(message.event).to.equal('created');
                    expect(message.record).to.be.an('object');
                    expect(message.record.id).to.equal(1);
                }
            },
            {
                event: 'destroyed',
                record: { id: 1 },
                assertions: function (message) {
                    expect(message.event).to.equal('destroyed');
                    expect(message.record).to.be.an('object');
                    expect(message.record.id).to.equal(1);
                }
            });
        });
    });

    describe('QueryMarshal', function () {
        var QueryMarshal;
        var marshal;
        var subscription;

        beforeEach(function () {
            QueryMarshal = waterlineProtocol.constructor.QueryMarshal;
            subscription = {
                dispose: sinon.stub()
            };
            marshal = new QueryMarshal(subscription);
        });

        it('should marshal a created event with an matching query', function () {
            var callback = sinon.spy();
            marshal.subscribe({ id: 1 }, callback);
            marshal.publish('created', { id: 1 });

            expect(callback).to.have.been.calledOnce;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
        });

        it('should marshal updated events', function () {
            var callback = sinon.spy();
            marshal.subscribe({}, callback);
            marshal.publish('created', { id: 1 });
            marshal.publish('updated', { id: 1, magic: 'test' });

            expect(callback).to.have.been.calledTwice;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.secondCall.args[0]).to.have.property('event', 'updated');
            expect(callback.secondCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.secondCall.args[0]).to.have.deep.property('record.magic', 'test');
        });

        it('should marshal updated events into created events for newly matching records',
          function () {
            var callback = sinon.spy();
            marshal.subscribe({ magic: 'test' }, callback);
            marshal.publish('created', { id: 1 });
            marshal.publish('updated', { id: 1, magic: 'test' });

            expect(callback).to.have.been.calledOnce;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.firstCall.args[0]).to.have.deep.property('record.magic', 'test');
        });

        it('should marshal updated events into destroyed events for newly non-matching records',
          function () {
            var callback = sinon.spy();
            marshal.subscribe({ magic: 'test' }, callback);
            marshal.publish('created', { id: 1, magic: 'test' });
            marshal.publish('updated', { id: 1, magic: 'asdf' });

            expect(callback).to.have.been.calledTwice;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.firstCall.args[0]).to.have.deep.property('record.magic', 'test');
            expect(callback.secondCall.args[0]).to.have.property('event', 'destroyed');
            expect(callback.secondCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.secondCall.args[0]).to.have.deep.property('record.magic', 'asdf');
        });

        it('should marshal the first updated event for a record into a created event', function () {
            var callback = sinon.spy();
            marshal.subscribe({}, callback);
            marshal.publish('updated', { id: 1 });

            expect(callback).to.have.been.calledOnce;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
        });

        it('should not marshal a destroyed event for a non-existent record', function () {
            var callback = sinon.spy();
            marshal.subscribe({}, callback);
            marshal.publish('destroyed', { id: 1 });

            expect(callback).to.not.have.been.called;
        });

        it('should not marshal a created event for a non-matching query', function () {
            var callback = sinon.spy();
            marshal.subscribe({ id: 2 }, callback);
            marshal.publish('created', { id: 1 });

            expect(callback).to.not.have.been.called;
        });

        it('should not marshal an updated event for a non-matching query', function () {
            var callback = sinon.spy();
            marshal.subscribe({ id: 2 }, callback);
            marshal.publish('created', { id: 1 });
            marshal.publish('updated', { id: 1 });

            expect(callback).to.not.have.been.called;
        });

        it('should not marshal a destroyed event for a non-matching query', function () {
            var callback = sinon.spy();
            marshal.subscribe({ id: 2 }, callback);
            marshal.publish('created', { id: 1 });
            marshal.publish('destroyed', { id: 1 });

            expect(callback).to.not.have.been.called;
        });
    });
});

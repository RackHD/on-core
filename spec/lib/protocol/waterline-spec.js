// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Protocol.Waterline', function() {
    var waterlineProtocol;
    var collection;
    var subscription;
    var Q;
    var Rx;

    helper.before();

    before(function() {
        Q = helper.injector.get('Q');
        Rx = helper.injector.get('Rx');
        waterlineProtocol = helper.injector.get('Protocol.Waterline');
    });

    beforeEach("waterline-spec beforeEach", function () {
        collection = { identity: 'dummy' };
    });

    afterEach("waterline-spec afterEach", function () {
        if (subscription) {
            subscription.dispose();
            subscription = null;
        }
    });

    helper.after();

    it('should publish a created event', function() {
        waterlineProtocol.publishRecord(collection, 'created', { id: 1 });
    });

    it('should publish an updated event', function() {
        waterlineProtocol.publishRecord(collection, 'updated', { id: 1 });
    });

    it('should publish a destroyed event', function() {
        waterlineProtocol.publishRecord(collection, 'destroyed', { id: 1 });
    });

    it('should observe a collection', function () {
        return waterlineProtocol.observeCollection(collection)
        .then(function (observable) {
            expect(observable).to.be.an.instanceof(Rx.Observable);
        });
    });

    function publishAndReceive(messages) {
        var deferred = Q.defer();
        var count = 0;
        if (!Array.isArray(messages)) {
            messages = Array.prototype.slice.call(arguments);
        }
        return waterlineProtocol.observeCollection(collection)
        .then(function (observable) {
            subscription = observable.subscribe(function (message) {
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
            });
            messages.forEach(function (message) {
                waterlineProtocol.publishRecord(collection, message.event, message.record);
            });
            return deferred.promise;
        });
    }

    it('should receive a created message', function () {
        return publishAndReceive({
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
        return publishAndReceive({
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
        return publishAndReceive({
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

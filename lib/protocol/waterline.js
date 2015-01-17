// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = waterlineProtocolFactory;

di.annotate(waterlineProtocolFactory, new di.Provide('Protocol.Waterline'));
di.annotate(waterlineProtocolFactory,
    new di.Inject(
        'Q',
        '_',
        'Rx',
        'Assert',
        'Protocol.Exchanges.Waterline',
        'Services.Messenger'
    )
);

function waterlineProtocolFactory (Q, _, Rx, assert, waterlineExchange, messenger) {
    function WaterlineProtocol() {
        this._observables = {};
    }

    WaterlineProtocol.prototype.publishRecord = function publishRecord(collection, event, record) {
        assert.object(collection, 'collection');
        assert.string(collection.identity, 'collection.identity');
        assert.string(event, 'event');
        assert.object(record, 'record');

        var routingKey = collection.identity + '.' + event + '.' + record.id;
        messenger.publish(
            waterlineExchange.exchange,
            routingKey,
            {
                event: event,
                record: record
            }
        );
    };

    WaterlineProtocol.prototype.observeCollection = function observeCollection(collection) {
        assert.object(collection, 'collection');
        assert.string(collection.identity, 'collection.identity');

        var self = this;
        var observable = self._observables[collection.identity];
        var observers = [];
        if (observable) {
            return Q.resolve(observable);
        }
        return messenger.subscribe(
            waterlineExchange.exchange,
            collection.identity + '.#',
            function (message) {
                assert.object(message, 'message');
                assert.object(message.data, 'message.data');
                assert.string(message.data.event, 'message.data.event');
                assert.object(message.data.record, 'message.data.record');

                observers.forEach(function (observer) {
                    observer.onNext({
                        event: message.data.event,
                        record: message.data.record
                    });
                });
            }
        ).then(function (subscription) {
            observable = Rx.Observable.create(function (observer) {
                observers.push(observer);
                return Rx.Disposable.create(function () {
                    var index = observers.indexOf(observer);
                    if (index !== -1) {
                        observers.splice(index, 1);
                    }
                    if (!observers.length) {
                        delete self._observables[collection.identity];
                        return subscription.dispose();
                    }
                    return Q.resolve();
                });
            });
            self._observables[collection.identity] = observable;
            return observable;
        });
    };

    return new WaterlineProtocol();
}

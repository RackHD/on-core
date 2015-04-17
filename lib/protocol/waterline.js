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
        'Constants',
        'Services.Messenger'
    )
);

function waterlineProtocolFactory (Q, _, Rx, assert, Constants, messenger) {
    function WaterlineProtocol() {
        this._observables = {};
    }

    WaterlineProtocol.prototype.publishRecord = function publishRecord(collection, event, record) {
        assert.object(collection, 'collection');
        assert.string(collection.identity, 'collection.identity');
        assert.string(event, 'event');
        assert.object(record, 'record');

        var routingKey = collection.identity + '.' + event + '.' + record.id;

        return messenger.publish(
            Constants.Protocol.Exchanges.Waterline.Name,
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
            Constants.Protocol.Exchanges.Waterline.Name,
            collection.identity + '.#',
            function (data) {
                observers.forEach(function (observer) {
                    observer.onNext({
                        event: data.event,
                        record: data.record
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

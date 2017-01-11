// Copyright 2015, EMC, Inc.

'use strict';

module.exports = waterlineProtocolFactory;

waterlineProtocolFactory.$provide = 'Protocol.Waterline';
waterlineProtocolFactory.$inject = [
    '_',
    'Assert',
    'Constants',
    'Services.Messenger'
];

function waterlineProtocolFactory (_, assert, Constants, messenger) {
    function WaterlineProtocol() {
    }

    WaterlineProtocol.prototype.publishRecord = function(collection, event, record, id) {
        assert.object(collection, 'collection');
        assert.string(collection.identity, 'collection.identity');
        assert.string(event, 'event');
        assert.object(record, 'record');

        id = id || record.id;
        var routingKey = collection.identity + '.' + event + '.' + id;

        return messenger.publishInternalEvents(
            Constants.Protocol.Exchanges.Waterline.Name,
            routingKey,
            {
                event: event,
                record: record
            }
        );
    };

    WaterlineProtocol.prototype.subscribeGraphCollectionUpdates = function(callback) {
        assert.func(callback, 'graph collection updates callback');
        return messenger.subscribe(
            Constants.Protocol.Exchanges.Waterline.Name,
            'graphobjects.updated.*',
            function(record) {
                callback(record.instanceId);
            }
        );
    };

    WaterlineProtocol.prototype.subscribeContextCollectionUpdates = function(callback) {
        assert.func(callback, 'context collection updates callback');
        return messenger.subscribe(
            Constants.Protocol.Exchanges.Waterline.Name,
            'contexts.updated.*',
            function(record) {
                callback(record.id);
            }
        );
    };

    return new WaterlineProtocol();
}

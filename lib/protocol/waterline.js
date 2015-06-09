// Copyright (c) 2015, EMC Corporation

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

    return new WaterlineProtocol();
}

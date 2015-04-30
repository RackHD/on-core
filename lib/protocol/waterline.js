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
        'Assert',
        'Constants',
        'Services.Messenger'
    )
);

function waterlineProtocolFactory (Q, _, assert, Constants, messenger) {
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

// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Protocol.Waterline', function() {
    var waterlineProtocol;
    var collection = { identity: 'dummy' };

    helper.before();

    before(function () {
        waterlineProtocol = helper.injector.get('Protocol.Waterline');
    });

    helper.after();

    it('should publish a created event', function() {
        return waterlineProtocol.publishRecord(collection, 'created', { id: 1 });
    });

    it('should publish an updated event', function() {
        return waterlineProtocol.publishRecord(collection, 'updated', { id: 1 });
    });

    it('should publish a destroyed event', function() {
        return waterlineProtocol.publishRecord(collection, 'destroyed', { id: 1 });
    });
});


// Copyright 2015, EMC, Inc.


'use strict';

describe('Protocol.Waterline', function() {
    var waterlineProtocol,
        collection = { identity: 'dummy' },
        testSubscription,
        messenger;
        
    helper.before();

    before(function () {
        waterlineProtocol = helper.injector.get('Protocol.Waterline');
        messenger = helper.injector.get('Services.Messenger');
        var Subscription = helper.injector.get('Subscription');
        testSubscription = new Subscription({},{});
        sinon.stub(testSubscription);
        sinon.stub(messenger);
    });

    helper.after();

    it('should publish a created event', function() {
        messenger.publish.resolves();
        return waterlineProtocol.publishRecord(collection, 'created', { id: 1 });
    });

    it('should publish an updated event', function() {
        messenger.publish.resolves();
        return waterlineProtocol.publishRecord(collection, 'updated', { id: 1 });
    });

    it('should publish a destroyed event', function() {     
        messenger.publish.resolves();
        return waterlineProtocol.publishRecord(collection, 'destroyed', { id: 1 });
    });
});


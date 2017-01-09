// Copyright 2015, EMC, Inc.

'use strict';

module.exports = messengerServiceFactory;

messengerServiceFactory.$provide = 'Services.Messenger';
messengerServiceFactory.$inject = [
    'Messenger',
    'Assert'

];

function messengerServiceFactory(
    Messenger,
    assert
) {
    function MessengerService(){
        this.messenger = new Messenger();
    }

    MessengerService.prototype.validate = function validate(data) {
	return this.messenger.validate(data);
    };

    MessengerService.prototype.queueName = function queueName(name, routingKey){
	return this.messenger.queueName(name, routingKey);
    };

    MessengerService.prototype.start = function start() {
        return this.messenger.start();
    };

    MessengerService.prototype.stop = function stop() {
        return this.messenger.stop();
    };

    MessengerService.prototype.publishExternalEvents  = function(
        name, routingKey, data, options
        ) {
            assert.ok(data.hasOwnProperty("type"));
            assert.ok(data.hasOwnProperty("action"));
            assert.ok(data.hasOwnProperty("severity"));
            assert.ok(data.hasOwnProperty("typeId"));
            assert.ok(data.hasOwnProperty("nodeId"));
            assert.ok(data.hasOwnProperty("payload"));

            assert.string(data.type);
            assert.string(data.action);
            assert.string(data.serverity);
            assert.string(data.typeId);
            if (data.nodeId !== null){
                assert.string(data.nodeId);}
            assert.object(data.payload);

            data.version = '1.0';
            data.createdAt = new Date();

            return this.messenger.publish(name, routingKey, data, options);
        };

        MessengerService.prototype.publishInternalEvents  = function(
            name, routingKey, data, options
        ) {
            return this.messenger.publish(name, routingKey, data, options);
        };

        MessengerService.prototype.subscribe  = function(name, routingKey, callback, type) {
            return this.messenger.subscribe(name, routingKey, callback, type);
        };

        MessengerService.prototype.request = function(name, routingKey, data, type, timeout) {
            return this.messenger.request(name, routingKey, data, type, timeout);
        };

        MessengerService.prototype.safeSubscriptionDispose = function (context) {
            return this.messenger.safeSubscriptionDispose(context);
        };

        MessengerService.prototype.subscribeCallback = function(context, options) {
            return this.messenger.subscribeCallback(context, options);
        };

        MessengerService.prototype.subscribeTimeout = function(
            context, data, headers, deliveryInfo
        )  {
            return this.messenger.subscribeTimeout(context, data, headers, deliveryInfo);
        };

        return new MessengerService();
}


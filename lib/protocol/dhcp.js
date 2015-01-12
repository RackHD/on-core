// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = dhcpProtocolFactory;

di.annotate(dhcpProtocolFactory, new di.Provide('Protocol.Dhcp'));
di.annotate(dhcpProtocolFactory,
    new di.Inject(
        'Protocol.Exchanges.Dhcp',
        'Services.Messenger'
    )
);

function dhcpProtocolFactory (dhcpExchange, messenger) {
    function DhcpProtocol() {
    }

    DhcpProtocol.prototype.lookupIpLease = function(ip) {
        return messenger.request(dhcpExchange.exchange, 'methods.lookupIpLease', { ip: ip })
        .then(function(message) {
            return message.data.result;
        });
    };

    DhcpProtocol.prototype.ipInRange = function(ip) {
        return messenger.request(dhcpExchange.exchange, 'methods.ipInRange', { ip: ip })
        .then(function(message) {
            return message.data.result;
        });
    };

    DhcpProtocol.prototype.peekLeaseTable = function() {
        return messenger.request(dhcpExchange.exchange, 'methods.peekLeaseTable')
        .then(function(message) {
            return message.data.result;
        });
    };

    DhcpProtocol.prototype.subscribeLookupIpLease = function subscribeLookupIpLease(callback) {
        return messenger.subscribe(dhcpExchange.exchange, 'methods.lookupIpLease',
                function(message) {
            var _callback = callback;
            // TODO: add this method
            // assert.isIp(message.ip);
            var result = _callback(message.data.ip);
            message.respond({ result: result });
        });
    };

    DhcpProtocol.prototype.subscribeIpInRange = function subscribeIpInRange(callback) {
        return messenger.subscribe(dhcpExchange.exchange, 'methods.ipInRange', function(message) {

            var _callback = callback;
            // TODO: add this method
            // assert.isIp(message.ip);
            var result = _callback(message.data.ip);
            message.respond({ result: result });
        });
    };

    DhcpProtocol.prototype.subscribePeekLeaseTable = function subscribePeekLeaseTable(callback) {
        return messenger.subscribe(dhcpExchange.exchange, 'methods.peekLeaseTable',
                function(message) {
            var _callback = callback;
            message.respond({ result: _callback() });
        });
    };

    return new DhcpProtocol();
}

// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = dhcpProtocolFactory;

di.annotate(dhcpProtocolFactory, new di.Provide('Protocol.Dhcp'));
di.annotate(dhcpProtocolFactory,
    new di.Inject(
        'Constants',
        'Services.Messenger',
        'Assert',
        '_'
    )
);

function dhcpProtocolFactory (Constants, messenger, assert, _) {
    function DhcpProtocol() {
    }

    DhcpProtocol.prototype.lookupIpLease = function lookupIpLease(ip) {
        assert.isIP(ip, 4, 'IPv4 Address');

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.lookupIpLease',
            { ip: ip }
        ).then(function(message) {
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    DhcpProtocol.prototype.pinIp = function pinIp(mac) {
        assert.isMac(mac);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.pinIp',
            { mac: mac }
        ).then(function(message) {
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    DhcpProtocol.prototype.unpinIp = function unpinIp(mac) {
        assert.isMac(mac);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinIp',
            { mac: mac }
        ).then(function(message) {
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    DhcpProtocol.prototype.ipInRange = function ipInRange(ip) {
        assert.isIP(ip, 4, 'IPv4 Address');

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.ipInRange',
            { ip: ip }
        ).then(function(message) {
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    DhcpProtocol.prototype.peekLeaseTable = function peekLeaseTable() {
        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.peekLeaseTable',
            {}
        ).then(function(message) {
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    DhcpProtocol.prototype.removeLease = function removeLease(mac) {
        assert.isMac(mac);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLease',
            { mac: mac }
        ).then(function(message) {
            return _.isEmpty(message.data) ? undefined : message.data.result;
        });
    };

    DhcpProtocol.prototype.subscribeLookupIpLease = function subscribeLookupIpLease(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.lookupIpLease',
            function(message) {
                message.respond({ result: callback(message.data.ip) });
            }
        );
    };

    DhcpProtocol.prototype.subscribePinIp = function subscribePinIp(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.pinIp',
            function(message) {
                message.respond({ result: callback(message.data.mac) });
            }
        );
    };

    DhcpProtocol.prototype.subscribeUnpinIp = function subscribeUnpinIp(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinIp',
            function(message) {
                message.respond({ result: callback(message.data.mac) });
            }
        );
    };

    DhcpProtocol.prototype.subscribeIpInRange = function subscribeIpInRange(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.ipInRange',
            function(message) {
                message.respond({ result: callback(message.data.ip) });
            }
        );
    };

    DhcpProtocol.prototype.subscribePeekLeaseTable = function subscribePeekLeaseTable(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.peekLeaseTable',
            function(message) {
                message.respond({ result: callback() });
            }
        );
    };

    DhcpProtocol.prototype.subscribeRemoveLease = function subscribeRemoveLease(callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLease',
            function(message) {
                message.respond({ result: callback(message.data.mac) });
            }
        );
    };

    return new DhcpProtocol();
}

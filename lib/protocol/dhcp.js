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
        'IpAddress',
        'MacAddress'
    )
);

function dhcpProtocolFactory (Constants, messenger, assert, IpAddress, MacAddress) {
    function DhcpProtocol() {
    }

    DhcpProtocol.prototype.lookupIpLease = function (ip) {
        assert.isIP(ip);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.lookupIpLease',
            new IpAddress({ value: ip })
        );
    };

    DhcpProtocol.prototype.pinMac = function (mac) {
        assert.isMac(mac);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.pinMac',
            new MacAddress({ value: mac })
        );
    };

    DhcpProtocol.prototype.unpinIp = function (ip) {
        assert.isIP(ip);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinIp',
            new IpAddress({ value: ip })
        );
    };

    DhcpProtocol.prototype.unpinMac = function (mac) {
        assert.isMac(mac);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinMac',
            new MacAddress({ value: mac })
        );
    };

    DhcpProtocol.prototype.ipInRange = function (ip) {
        assert.isIP(ip);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.ipInRange',
            new IpAddress({ value: ip })
        );
    };

    DhcpProtocol.prototype.peekLeaseTable = function () {
        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.peekLeaseTable',
            {}
        );
    };

    DhcpProtocol.prototype.removeLease = function (mac) {
        assert.isMac(mac);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLease',
            new MacAddress({ value: mac })
        );
    };

    DhcpProtocol.prototype.removeLeaseByIp = function (ip) {
        assert.isIP(ip);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLeaseByIp',
            new IpAddress({ value: ip })
        );
    };

    DhcpProtocol.prototype.subscribeLookupIpLease = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.lookupIpLease',
            function(data, message) {
                message.promise(
                    callback(data.value)
                );
            },
            IpAddress
        );
    };

    DhcpProtocol.prototype.subscribePinMac = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.pinMac',
            function(data, message) {
                message.promise(
                    callback(data.value)
                );
            },
            MacAddress
        );
    };

    DhcpProtocol.prototype.subscribeUnpinIp = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinIp',
            function(data, message) {
                message.promise(
                    callback(data.value)
                );
            },
            IpAddress
        );
    };

    DhcpProtocol.prototype.subscribeUnpinMac = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinMac',
            function(data, message) {
                message.promise(
                    callback(data.value)
                );
            },
            MacAddress
        );
    };

    DhcpProtocol.prototype.subscribeIpInRange = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.ipInRange',
            function(data, message) {
                message.promise(
                    callback(data.value)
                );
            },
            IpAddress
        );
    };

    DhcpProtocol.prototype.subscribePeekLeaseTable = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.peekLeaseTable',
            function(data, message) {
                message.promise(
                    callback()
                );
            }
        );
    };

    DhcpProtocol.prototype.subscribeRemoveLease = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLease',
            function(data, message) {
                message.promise(
                    callback(data.value)
                );
            },
            MacAddress
        );
    };

    DhcpProtocol.prototype.subscribeRemoveLeaseByIp = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLeaseByIp',
            function(data, message) {
                message.promise(
                    callback(data.value)
                );
            },
            IpAddress
        );
    };

    return new DhcpProtocol();
}

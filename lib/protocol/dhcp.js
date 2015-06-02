// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = dhcpProtocolFactory;

dhcpProtocolFactory.$provide = 'Protocol.Dhcp';
dhcpProtocolFactory.$inject = [
    'Q',
    'Constants',
    'Services.Messenger',
    'Assert',
    'IpAddress',
    'MacAddress',
    'Result'
];

function dhcpProtocolFactory (
    Q,
    Constants,
    messenger,
    assert,
    IpAddress,
    MacAddress,
    Result
) {
    function DhcpProtocol() {
    }

    DhcpProtocol.prototype.lookupIpLease = function (ip) {
        assert.isIP(ip);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.lookupIpLease',
            new IpAddress({ value: ip })
        ).then(function (data) {
            return data.value;
        });
    };

    DhcpProtocol.prototype.subscribeLookupIpLease = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.lookupIpLease',
            function(data, message) {
                Q.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    if (result !== undefined) {
                        return message.resolve(
                            new MacAddress({ value: result.mac })
                        );
                    } else {
                        return message.resolve(
                            new Result({ value: {} })
                        );
                    }
                }).catch(function (error) {
                    return message.reject(error);
                });
            },
            IpAddress
        );
    };

    DhcpProtocol.prototype.pinMac = function (mac) {
        assert.isMac(mac);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.pinMac',
            new MacAddress({ value: mac })
        ).then(function (data) {
            return data.value;
        });
    };

    DhcpProtocol.prototype.subscribePinMac = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.pinMac',
            function(data, message) {
                Q.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            },
            MacAddress
        );
    };

    DhcpProtocol.prototype.unpinIp = function (ip) {
        assert.isIP(ip);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinIp',
            new IpAddress({ value: ip })
        ).then(function (data) {
            return data.value;
        });
    };

    DhcpProtocol.prototype.subscribeUnpinIp = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinIp',
            function(data, message) {
                Q.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            },
            IpAddress
        );
    };

    DhcpProtocol.prototype.unpinMac = function (mac) {
        assert.isMac(mac);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinMac',
            new MacAddress({ value: mac })
        ).then(function (data) {
            return data.value;
        });
    };

    DhcpProtocol.prototype.subscribeUnpinMac = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.unpinMac',
            function(data, message) {
                Q.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            },
            MacAddress
        );
    };

    DhcpProtocol.prototype.ipInRange = function (ip) {
        assert.isIP(ip);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.ipInRange',
            new IpAddress({ value: ip })
        ).then(function (data) {
            return data.value;
        });
    };

    DhcpProtocol.prototype.subscribeIpInRange = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.ipInRange',
            function(data, message) {
                Q.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            },
            IpAddress
        );
    };

    DhcpProtocol.prototype.peekLeaseTable = function () {
        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.peekLeaseTable',
            {}
        ).then(function (data) {
            return data.value;
        });
    };

    DhcpProtocol.prototype.subscribePeekLeaseTable = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.peekLeaseTable',
            function(data, message) {
                Q.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            }
        );
    };

    DhcpProtocol.prototype.removeLease = function (mac) {
        assert.isMac(mac);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLease',
            new MacAddress({ value: mac })
        ).then(function (data) {
            return data.value;
        });
    };

    DhcpProtocol.prototype.subscribeRemoveLease = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLease',
            function(data, message) {
                Q.resolve().then(function() {
                        return callback(data.value);
                    }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            },
            MacAddress
        );
    };

    DhcpProtocol.prototype.removeLeaseByIp = function (ip) {
        assert.isIP(ip);

        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLeaseByIp',
            new IpAddress({ value: ip })
        ).then(function (data) {
                return data.value;
            });
    };

    DhcpProtocol.prototype.subscribeRemoveLeaseByIp = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLeaseByIp',
            function(data, message) {
                Q.resolve().then(function() {
                    return callback(data.value);
                }).then(function (result) {
                    return message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    return message.reject(error);
                });
            },
            IpAddress
        );
    };

    return new DhcpProtocol();
}

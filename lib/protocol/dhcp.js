// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = dhcpProtocolFactory;

di.annotate(dhcpProtocolFactory, new di.Provide('Protocol.Dhcp'));
di.annotate(dhcpProtocolFactory,
    new di.Inject(
        'Q',
        'Constants',
        'Services.Messenger',
        'Assert',
        'IpAddress',
        'MacAddress',
        'Result'
    )
);

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

    DhcpProtocol.prototype.peekLeaseTable = function () {
        return messenger.request(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.peekLeaseTable',
            {}
        ).then(function (data) {
            return data.value;
        });
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

    DhcpProtocol.prototype.subscribeLookupIpLease = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.lookupIpLease',
            function(data, message) {
                Q.resolve(
                    callback(data.value)
                ).then(function (result) {
                    if (result !== undefined) {
                        message.resolve(
                            new MacAddress({ value: result.mac })
                        );
                    } else {
                        message.resolve(
                            new Result({ value: undefined })
                        );
                    }
                }).catch(function (error) {
                    message.reject(error);
                });
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
                Q.resolve(
                    callback(data.value)
                ).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
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
                Q.resolve(
                    callback(data.value)
                ).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
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
                Q.resolve(
                    callback(data.value)
                ).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
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
                Q.resolve(
                    callback(data.value)
                ).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
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
                Q.resolve(
                    callback(data.value)
                ).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
            }
        );
    };

    DhcpProtocol.prototype.subscribeRemoveLease = function (callback) {
        assert.func(callback);

        return messenger.subscribe(
            Constants.Protocol.Exchanges.Dhcp.Name,
            'methods.removeLease',
            function(data, message) {
                Q.resolve(
                    callback(data.value)
                ).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
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
                Q.resolve(
                    callback(data.value)
                ).then(function (result) {
                    message.resolve(
                        new Result({ value: result })
                    );
                }).catch(function (error) {
                    message.reject(error);
                });
            },
            IpAddress
        );
    };

    return new DhcpProtocol();
}

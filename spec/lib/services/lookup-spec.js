// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Lookup Service', function() {
    var lookupService, dhcpProtocol, MacAddress, IpAddress;

    helper.before();

    before(function() {
        lookupService = helper.injector.get('Services.Lookup');
        dhcpProtocol = helper.injector.get('Protocol.Dhcp');
        MacAddress = helper.injector.get('MacAddress');
    });

    afterEach(function () {
        if (this.subscription) {
            this.subscription.dispose();
        }
    });

    helper.after();

    it('should lookup the mac address for an IP', function() {
        var self = this;

        function lookupIpLease(ip) {
            if (ip === '10.1.1.2') {
                return '01:01:01:01:01:01';
            }
            if (ip === '10.1.1.3') {
                return '02:02:02:02:02:02';
            }

            throw new Error('should not be here');
        }

        return dhcpProtocol.subscribeLookupIpLease(lookupIpLease)
            .then(function(subscription) {
                expect(subscription).to.be.ok;
                self.subscription = subscription;
                return lookupService.ipAddressToMacAddress('10.1.1.2');
            })
            .then(function(mac) {
                expect(mac).to.equal('01:01:01:01:01:01');
                return lookupService.ipAddressToMacAddress('10.1.1.3');
            })
            .then(function(mac) {
                expect(mac).to.equal('02:02:02:02:02:02');
            });
    });

    it('should cache the mac address for an IP', function() {
        var self = this,
            calledOnce = false,
            cachedIp = '10.1.1.4';

        function lookupIpLease() {
            if (calledOnce) {
                return '04:04:04:04:04:04';
            } else {
                calledOnce = true;
                return '03:03:03:03:03:03';
            }
        }

        return dhcpProtocol.subscribeLookupIpLease(lookupIpLease)
            .then(function(subscription) {
                expect(subscription).to.be.ok;
                self.subscription = subscription;
                return lookupService.ipAddressToMacAddress(cachedIp);
            })
            .then(function(mac) {
                expect(mac).to.equal('03:03:03:03:03:03');
                return lookupService.ipAddressToMacAddress(cachedIp);
            })
            .then(function(mac) {
                expect(lookupIpLease()).to.equal('04:04:04:04:04:04');
                expect(mac).to.equal('03:03:03:03:03:03');
            });
    });
});

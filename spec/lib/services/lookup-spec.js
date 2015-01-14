// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Lookup Service", function() {
    var injector;
    var lookupService;
    var dhcpProtocol;
    var dhcpSubcription;

    beforeEach(function() {
        injector = helper.baseInjector.createChild(_.flatten([
            helper.requireGlob(__dirname + '/../lib/protocol/**/*.js'),
            helper.requireGlob(__dirname + '/../lib/services/*.js')
        ]));
        lookupService = injector.get('Services.Lookup');
        dhcpProtocol = injector.get('Protocol.Dhcp');
        return helper.initializeMessenger(injector);
    });

    afterEach(function() {
        return dhcpSubcription.dispose();
    });

    it("should lookup the mac address for an IP", function() {
        function lookupIpLease(ip) {
            if (ip === '10.1.1.2') {
                return "01:01:01:01:01:01";
            }
            if (ip === '10.1.1.3') {
                return "02:02:02:02:02:02";
            }
        }

        return dhcpProtocol.subscribeLookupIpLease(lookupIpLease)
            .then(function(subscription) {
                expect(subscription).to.be.ok;
                dhcpSubcription = subscription;
                return lookupService.ipAddressToMacAddress('10.1.1.2');
            })
            .then(function(mac) {
                expect(mac).to.equal("01:01:01:01:01:01");
                return lookupService.ipAddressToMacAddress('10.1.1.3');
            })
            .then(function(mac) {
                expect(mac).to.equal("02:02:02:02:02:02");
            });
    });

    it("should cache the mac address for an IP", function() {
        var calledOnce = false;
        var cachedIp = '10.1.1.4';
        function lookupIpLease() {
            console.log(calledOnce);
            if (calledOnce) {
                return "04:04:04:04:04:04";
            } else {
                calledOnce = true;
                return "03:03:03:03:03:03";
            }
        }

        return dhcpProtocol.subscribeLookupIpLease(lookupIpLease)
            .then(function(subscription) {
                expect(subscription).to.be.ok;
                return lookupService.ipAddressToMacAddress(cachedIp);
            })
            .then(function(mac) {
                expect(mac).to.equal("03:03:03:03:03:03");
                return lookupService.ipAddressToMacAddress(cachedIp);
            })
            .then(function(mac) {
                expect(lookupIpLease()).to.equal("04:04:04:04:04:04");
                // This should be cached now
                expect(mac).to.equal("03:03:03:03:03:03");
            });
    });
});

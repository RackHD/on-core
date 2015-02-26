// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Lookup Service', function() {
    var lookupService, dhcpProtocol, MacAddress, Errors;

    helper.before();

    before(function() {
        lookupService = helper.injector.get('Services.Lookup');
        dhcpProtocol = helper.injector.get('Protocol.Dhcp');
        MacAddress = helper.injector.get('MacAddress');
        Errors = helper.injector.get('Errors');
    });

    afterEach(function () {
        if (this.subscription) {
            this.subscription.dispose();
        }
    });

    helper.after();

    describe('macAddressToNodeId', function() {
        var macAddressToNodeStub;

        before('macAddressToNodeId before', function() {
            macAddressToNodeStub = sinon.stub(lookupService, 'macAddressToNode');
        });

        beforeEach('macAddressToNodeId beforeEach', function() {
            macAddressToNodeStub.reset();
        });

        after('macAddressToNodeId after', function() {
            macAddressToNodeStub.restore();
        });

        it('macAddressToNodeId should return a LookupError if there is no node', function() {
            macAddressToNodeStub.resolves(null);

            return lookupService.macAddressToNodeId('08:00:27:7a:c0:00').should.be.rejectedWith(
                            Errors.LookupError,
                            'Unable to locate node via MAC address.');
        });
    });

    it('should lookup the mac address for an IP', function() {
        var self = this;

        function lookupIpLease(ip) {
            if (ip === '10.1.1.2') {
                return { mac: '01:01:01:01:01:01' };
            }
            if (ip === '10.1.1.3') {
                return { mac: '02:02:02:02:02:02' };
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
                return { mac: '04:04:04:04:04:04' };
            } else {
                calledOnce = true;
                return { mac: '03:03:03:03:03:03' };
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
                expect(lookupIpLease().mac).to.equal('04:04:04:04:04:04');
                expect(mac).to.equal('03:03:03:03:03:03');
            });
    });
});

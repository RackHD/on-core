// Copyright 2015, Renasar Technologies Inc.
/* jshint node:true */

"use strict";

describe("DHCP Lease Cache", function() {
    var waterline;
    var leaseCache;

    before("DHCP Lease Cache before", function() {
        return helper.start()
        .then(function() {
            leaseCache = helper.injector.get("DhcpLeaseCache");
            waterline = helper.injector.get("Services.Waterline");
        });
    });

    after("DHCP Lease Cache after", function() {
        return helper.reset()
        .then(function() {
            return helper.stop();
        });
    });

    it("should not get a lease if the IP doesn't exist", function() {
        return expect(leaseCache.getLeaseByIp('5.5.5.5')).to.become(undefined);
    });

    it("should get a lease by ip", function() {
        var leaseDoc = {
            ip: '200.200.200.200',
            macAddress: '20:02:00:20:02:00'
        };
        return waterline.dhcpleases.create(leaseDoc)
        .then(function() {
            return leaseCache.getLeaseByIp('200.200.200.200');
        })
        .then(function(doc) {
            expect(doc).to.have.property('ip').that.equals(leaseDoc.ip);
            expect(doc).to.have.property('macAddress').that.equals(leaseDoc.macAddress);
        });
    });

    describe('setLeaseByIp', function() {
        var updateIp = '101.101.101.101';
        var updateMac = '10:11:01:10:11:01';

        var staleIp = '150.150.150.150';
        var staleMac = '15:01:50:15:01:50';

        before('setLeaseByIp before', function() {
            return waterline.dhcpleases.create({ ip: updateIp, macAddress: updateMac })
            .then(function() {
                return waterline.dhcpleases.create({ ip: staleIp, macAddress: staleMac });
            });
        });

        it("should create a lease by ip", function() {
            var ip = '100.100.100.100';
            var mac = '10:01:00:10:01:00';

            return leaseCache.setLeaseByIp(ip, mac)
            .then(function() {
                return waterline.dhcpleases.findOne({ ip: ip });
            })
            .then(function(doc) {
                expect(doc).to.have.property('ip').that.equals(ip);
                expect(doc).to.have.property('macAddress').that.equals(mac);
            });
        });

        it("should update a lease by ip", function() {
            return leaseCache.setLeaseByIp('102.102.102.102', updateMac)
            .then(function(doc) {
                expect(doc[0]).to.have.property('ip').that.equals('102.102.102.102');
                expect(doc[0]).to.have.property('macAddress').that.equals(updateMac);
            });
        });

        it("should remove stale leases if they conflict on create", function() {
            return leaseCache.setLeaseByIp('150.150.150.150', '15:11:51:15:11:51')
            .then(function(doc) {
                expect(doc).to.have.property('ip').that.equals('150.150.150.150');
                expect(doc).to.have.property('macAddress').that.equals('15:11:51:15:11:51');
                return waterline.dhcpleases.findOne({ macAddress: staleMac });
            })
            .then(function(doc) {
                expect(doc).to.be.empty;
            });
        });
    });

    describe("removeLeaseByMacAddress", function() {
        var destroyIp = '105.105.105.105';
        var destroyMac = '10:51:05:10:51:05';

        before("removeLeaseByMacAddress before", function() {
            return waterline.dhcpleases.create({ ip: destroyIp, macAddress: destroyMac })
            .then(function() {
                return waterline.dhcpleases.findOne({ macAddress: destroyMac });
            })
            .then(function(doc) {
                expect(doc).to.have.property('ip').that.equals(destroyIp);
                expect(doc).to.have.property('macAddress').that.equals(destroyMac);
            });
        });

        it('should remove a lease by mac address', function() {
            return leaseCache.removeLeaseByMacAddress(destroyMac)
            .then(function() {
                return waterline.dhcpleases.findOne({ macAddress: destroyMac });
            })
            .then(function(doc) {
                expect(doc).to.be.empty;
            });
        });
    });

});

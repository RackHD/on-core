// Copyright 2016, EMC, Inc.
/* jshint node:true */

'use strict';

describe('ARP Poller Service', function () {
    var fs;
    var waterline = {};
    var rx = {};
    var service;
    var procData = "IP address   HW type   Flags    HW address            Mask   Device\n" +
                   "1.2.3.4      0x1       0x2      52:54:be:ef:ff:12     *      eth1\n" +
                   "2.3.4.5      0x1       0x2      00:00:be:ef:ff:00     *      eth0\n" +
                   "2.3.4.6      0x1       0x2      00:00:be:ef:ff:01     *      eth0\n";
    
    var parsedData = [
        { ip:'1.2.3.4', mac:'52:54:be:ef:ff:12', iface:'eth1', flag:'0x2' },
        { ip:'2.3.4.5', mac:'00:00:be:ef:ff:00', iface:'eth0', flag:'0x2' },
        { ip:'2.3.4.6', mac:'00:00:be:ef:ff:01', iface:'eth0', flag:'0x2' }
    ];
           
    helper.before();
         
    before(function () {
        helper.setupInjector([
            helper.di.simpleWrapper(waterline,'Services.Waterline'),
            helper.di.simpleWrapper(rx,'Rx')
        ]);

        waterline.lookups = {
            setIp: sinon.stub().resolves()
        };
        
        rx.Observable = {
            interval: sinon.stub().returns({
                subscribe: sinon.stub().returns({
                    dispose: sinon.stub().resolves()
                })
            })
        };
        
        service = helper.injector.get('Services.ArpPoller');
        fs = helper.injector.get('fs');
        sinon.stub(fs, 'readFileAsync');
    });

    helper.after(function() {
        fs.readFileAsync.restore();
    });
    
    beforeEach(function() {
        fs.readFileAsync.reset();
        waterline.lookups.setIp.reset();
    });

    describe("ARP poller methods", function(){
        it('should start the service', function() {
            return service.start()
            .then(function() {
                expect(service.subscription).to.be.fullfilled;
            });
        });
        
        it('should stop the service', function() {
            return service.stop()
            .then(function() {
                expect(service.subscription).to.equal(undefined);
            });
        });
                
        it('should parse ARP data', function() {
            fs.readFileAsync.resolves(procData);
            return service.parseArpCache()
            .then(function(parsed) {
                expect(parsed).to.deep.equal(parsedData);
            });
        });
        
        it('should parse ARP data with error', function() {
            fs.readFileAsync.rejects('error');
            return expect(service.parseArpCache()).to.be.rejectedWith('error');
        });
        
        it('should handle initial ARP data', function() {
            fs.readFileAsync.resolves(procData);
            service.last = { ip:'1.2.3.4', mac:'52:54:be:ef:ff:12', iface:'eth1', flag:'0x2' };
            return service.arpCacheHandler()
            .then(function() {
                expect(service.last).to.deep.equal(parsedData);
                expect(service.current).to.deep.equal(parsedData);
            });
        });

        it('should handle updated ARP data', function() {
            fs.readFileAsync.resolves(
                "IP address  HW type  Flags   HW address         Mask  Device\n" +
                "1.2.3.4     0x1      0x0     52:54:be:ef:ff:12  *     eth1\n" +
                "2.3.4.5     0x1      0x0     00:00:be:ef:ff:00  *     eth0\n" +
                "2.3.4.9     0x1      0x2     00:00:be:ef:ff:01  *     eth0\n"
            );
            parsedData[0].flag = '0x0';
            parsedData[1].flag = '0x0';
            parsedData[2].ip = '2.3.4.9';
            return service.arpCacheHandler()
            .then(function() {
                expect(waterline.lookups.setIp).to.be.calledThrice;
                expect(service.last).to.deep.equal(parsedData);
                expect(service.current).to.deep.equal(parsedData);
            });
        });
        
        it('should handle ARP data with error', function() {
            fs.readFileAsync.rejects('error');
            return expect(service.arpCacheHandler()).to.be.rejectedWith('error');
        });
        
    });
});

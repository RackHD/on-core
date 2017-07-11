// Copyright 2016, EMC, Inc.


'use strict';

describe('ARPCache', function () {
    var arpCache;
    var fs;
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
        arpCache = helper.injector.get('ARPCache');
        fs = helper.injector.get('fs');
    });

    beforeEach(function() {
        this.sandbox.stub(fs, 'readFileAsync');
    });

    helper.after();

    describe("Handle ARP Entry", function(){
        it('should parse ARP data', function() {
            fs.readFileAsync.resolves(procData);
            return arpCache.parseArpCache()
            .then(function(parsed) {
                expect(parsed).to.deep.equal(parsedData);
            });
        });
        
        it('should parse ARP data with error', function() {
            fs.readFileAsync.rejects('error');
            return expect(arpCache.parseArpCache()).to.be.rejectedWith('error');
        });
        
        it('should handle initial ARP data', function() {
            fs.readFileAsync.resolves(procData);
            arpCache.last = {ip:'1.2.3.4', mac:'52:54:be:ef:ff:12', iface:'eth1', flag:'0x2'};
            return arpCache.getCurrent()
            .then(function() {
                expect(arpCache.last).to.deep.equal(parsedData);
                expect(arpCache.current).to.deep.equal(parsedData);
            });
        });

        it('should handle updated ARP data', function() {
            fs.readFileAsync.resolves(
                "IP address  HW type  Flags   HW address         Mask  Device\n" +
                "1.2.3.4     0x1      0x1     52:54:be:ef:ff:12  *     eth1\n" +
                "2.3.4.5     0x1      0x0     00:00:be:ef:ff:00  *     eth0\n" +
                "2.3.4.9     0x1      0x2     00:00:be:ef:ff:01  *     eth0\n"
            );
            parsedData[0].flag = '0x1';
            parsedData[1].flag = '0x0';
            parsedData[2].ip = '2.3.4.9';
            return arpCache.getCurrent()
            .then(function(data) {
                expect(arpCache.last).to.deep.equal(parsedData);
                expect(arpCache.current).to.deep.equal(parsedData);
                expect(data).to.deep.equal([
                    {ip:'1.2.3.4', mac:'52:54:be:ef:ff:12'},
                    {ip:'2.3.4.9', mac:'00:00:be:ef:ff:01'}
                ]);
            });
        });
        
        it('should handle ARP data with error', function() {
            fs.readFileAsync.rejects('error');
            return expect(arpCache.getCurrent()).to.be.rejectedWith('error');
        });
    });
});

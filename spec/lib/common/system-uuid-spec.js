// Copyright 2016, EMC, Inc.
'use strict';

describe("SystemUuid", function() {
    var subject;
    var regEx = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;
    var fs;
    var uuid = '0e2c320f-f29e-47c6-be18-0c833e0f080c';
    
    before(function () {
        helper.setupInjector();
        subject = helper.injector.get('SystemUuid');
        fs = helper.injector.get('fs');
        sinon.stub(fs, 'readFileAsync');
    });

    helper.after(function() {
        fs.readFileAsync.restore();
    });
    
    beforeEach(function() {
        fs.readFileAsync.reset();
    });

    describe('getUuid', function () {
        it('should return system uuid', function () {
            fs.readFileAsync.resolves(uuid);
            return subject.getUuid()
            .then(function(data) {
                expect(regEx.test(data)).to.be.ok;
                expect(data).to.equal(uuid);
            });
        });
        
        it('should return generated uuid', function () {
            fs.readFileAsync.resolves('xyz');
            return subject.getUuid()
            .then(function(data) {
                expect(regEx.test(data)).to.be.ok;
            });
        });
    });
});

// Copyright 2015, EMC, Inc.


'use strict';

describe("TFTP protocol", function () {

    helper.before();

    before(function () {
        this.protocol = helper.injector.get('Protocol.Tftp');
    });

    helper.after();

    it("should return a TFTP protocol", function() {
        expect(this.protocol).to.be.an('Object');
    });

});
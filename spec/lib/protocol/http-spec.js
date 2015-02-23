// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Http Protocol functions", function () {
    helper.before();

    before(function () {
        this.http = helper.injector.get('Protocol.Http');
    });

    helper.after();

    it("should load", function() {
        expect(this.http).to.be.ok;
    });

});
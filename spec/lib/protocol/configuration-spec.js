// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Configuration Protocol functions", function () {

    helper.before();

    before(function () {
        this.http = helper.injector.get('Protocol.Configuration');
    });

    helper.after();

    describe("subscribeSet", function() {
        it("should subscribe", function() {
            var self = this;

            return self.http.subscribeSet(function(_data) {
                //NOTE(heckj): need matching code to invoke this subscription
            });
        });
    });

    describe("subscribeGet", function() {
        it("should subscribe", function() {
            var self = this;

            return self.http.subscribeGet(function(_data) {
                //NOTE(heckj): need matching code to invoke this subscription
            });
        });
    });

});
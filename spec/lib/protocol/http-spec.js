// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Http Protocol functions", function () {
    helper.before();

    before(function () {
        this.http = helper.injector.get('Protocol.Http');
    });

    helper.after();

    describe("publish http response", function() {
        //NOTE: no matching internal code to listen for these events
        it("should publish a poller alert event", function() {
            var self = this,
                data = { foo: 'bar' };

            return self.http.publishResponse(data);
        });
    });

});
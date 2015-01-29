// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Event subscriber functions", function() {
    helper.before();

    before(function () {
        this.events = helper.injector.get('Protocol.Events');
    });

    helper.after();

    it("should subscribe to an HTTP response event", function(done) {
        var self = this,
            task = helper.injector.get('Protocol.Task'),
            data = {
                test: 1,
                data: [1, 2]
            },
            id = "5498a7632b9ef0a8b94307a8";

        task.subscribeHttpResponse(id, function(_data) {
            expect(_data).to.deep.equal(data);
            done();
        })
        .then(function(sub) {
            expect(sub).to.be.ok;
            self.events.publishHttpResponse(id, data);
        });
    });

    it("should subscribe to a TFTP success event", function(done) {
        var self = this,
            task = helper.injector.get('Protocol.Task'),
            data = {
                test: 1,
                data: [1, 2]
            },
            id = "5498a7632b9ef0a8b94307a8";

        task.subscribeTftpSuccess(id, function(_data) {
            expect(_data).to.deep.equal(data);
            done();
        })
        .then(function(sub) {
            expect(sub).to.be.ok;
            self.events.publishTftpSuccess(id, data);
        });
    });

    it("should subscribe to a DHCP lease bind event", function(done) {
        var self = this,
            task = helper.injector.get('Protocol.Task'),
            data = {
                test: 1,
                data: [1, 2]
            },
            id = "5498a7632b9ef0a8b94307a8";

        task.subscribeDhcpBoundLease(id, function(_data) {
            expect(_data).to.deep.equal(data);
            done();
        })
        .then(function(sub) {
            expect(sub).to.be.ok;
            self.events.publishDhcpBoundLease(id, data);
        });
    });

    // TODO: this test should subscribe to the catch all to know when to timeout
    // in order to speed up execution.
    it("should not subscribe to a response for other identifiers", function() {
        var self = this,
            Q = helper.injector.get('Q'),
            task = helper.injector.get('Protocol.Task'),
            otherId = "5498a7632b9ef0a8b94307a9",
            id = "5498a7632b9ef0a8b94307a8",
            deferred = Q.defer();

        task.subscribeHttpResponse(otherId, function () {
            setImmediate(function () {
                deferred.resolve();
            });
        }).then(function (sub) {
            expect(sub).to.be.ok;
            task.subscribeHttpResponse(id, function() {
                var err = new Error("Did not expect to receive a message from " +
                                    " routing keys not mapped to " + otherId);
                deferred.reject(err);
            })
            .then(function(sub) {
                expect(sub).to.be.ok;
                self.events.publishHttpResponse(otherId, {});
            });
        });

        return deferred.promise;
    });
});

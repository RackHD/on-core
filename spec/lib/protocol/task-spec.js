// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Event subscriber functions", function() {
    helper.before(function(context) {
        context.events = helper.injector.get('Protocol.Events');
    });

    helper.after();

    it("should subscribe to an HTTP response event", function(done) {
        var self = this,
            task = helper.injector.get('Protocol.Task'),
            data = {
                test: 1,
                data: [1, 2]
            },
            id = "testIdHttpResponse";

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
            id = "testIdTftpSuccess";

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
            id = "testIdDhcpLease";

        task.subscribeDhcpBoundLease(id, function(_data) {
            expect(_data).to.deep.equal(data);
            done();
        })
        .then(function(sub) {
            expect(sub).to.be.ok;
            self.events.publishDhcpBoundLease(id, data);
        });
    });

    it("should not subscribe to a response for other identifiers", function(done) {
        var self = this,
            Q = helper.injector.get('Q'),
            task = helper.injector.get('Protocol.Task'),
            otherId = "testidother",
            id = "testid";

        task.subscribeHttpResponse(id, function() {
            var err = new Error("Did not expect to receive a message from " +
                                " routing keys not mapped to " + id);
            done(err);
        })
        .then(function(sub) {
            expect(sub).to.be.ok;
            self.events.publishHttpResponse(otherId, {});
            return Q.delay(1000);
        })
        .then(function() {
            done();
        });
    });
});

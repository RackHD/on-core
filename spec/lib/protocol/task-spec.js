// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("Event subscriber functions", function() {
    var injector;
    var events;

    before(function() {
        injector = helper.baseInjector.createChild(_.flatten([
            helper.requireGlob(__dirname + '/../lib/protocol/**/*.js'),
            helper.requireGlob(__dirname + '/../lib/services/*.js')
        ]));
        events = injector.get('Protocol.Events');
        return helper.initializeMessenger(injector);
    });

    it("should subscribe to an HTTP response event", function(done) {
        var task = injector.get('Protocol.Task');
        var data = {
            test: 1,
            data: [1, 2]
        };
        var id = "testIdHttpResponse";
        task.subscribeHttpResponse(id, function(_data) {
            expect(_data).to.deep.equal(data);
            done();
        })
        .then(function(sub) {
            expect(sub).to.be.ok;
            events.publishHttpResponse(id, data);
        });
    });

    it("should subscribe to a TFTP success event", function(done) {
        var task = injector.get('Protocol.Task');
        var data = {
            test: 1,
            data: [1, 2]
        };
        var id = "testIdTftpSuccess";
        task.subscribeTftpSuccess(id, function(_data) {
            expect(_data).to.deep.equal(data);
            done();
        })
        .then(function(sub) {
            expect(sub).to.be.ok;
            events.publishTftpSuccess(id, data);
        });
    });

    it("should subscribe to a DHCP lease bind event", function(done) {
        var task = injector.get('Protocol.Task');
        var data = {
            test: 1,
            data: [1, 2]
        };
        var id = "testIdDhcpLease";
        task.subscribeDhcpBoundLease(id, function(_data) {
            expect(_data).to.deep.equal(data);
            done();
        })
        .then(function(sub) {
            expect(sub).to.be.ok;
            events.publishDhcpBoundLease(id, data);
        });
    });

    it("should not subscribe to a response for other identifiers", function(done) {
        var Q = injector.get('Q');
        var task = injector.get('Protocol.Task');
        var otherId = "testidother";
        var id = "testid";
        task.subscribeHttpResponse(id, function() {
            var err = new Error("Did not expect to receive a message from " +
                                " routing keys not mapped to " + id);
            done(err);
        })
        .then(function(sub) {
            expect(sub).to.be.ok;
            events.publishHttpResponse(otherId, {});
            return Q.delay(1000);
        })
        .then(function() {
            done();
        });
    });
});

// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe("StatsD Service", function () {




    helper.before(function(context) {
        var util = require('util');
        var events = require('events');

        // Fake memwatch to drive code & events
        var FakeMemWatch = function() {};
        util.inherits(FakeMemWatch, events.EventEmitter);

        // available as this.fakeMemWatch from within tests
        context.fakeMemWatch = new FakeMemWatch();

        return [
            helper.di.simpleWrapper(context.fakeMemWatch, 'memwatch'),
            helper.require('/spec/mocks/logger.js')
        ];
    });
    helper.after();

    describe("handleLeak", function() {
        var loggerSpy;
        before("handleLeak before", function() {
            var logger = helper.injector.get("Logger").initialize();
            loggerSpy = sinon.stub(logger, 'log');
        });
        beforeEach("handleLeak beforeEach", function() {
            loggerSpy.reset();
        });
        after("handleLeak after", function() {
            loggerSpy.restore();
        });
        it("should log info", function() {
            var statsdService = helper.injector.get('Services.StatsD');
            var testInfo = { foo: 'bar' };
            statsdService.handleLeak(testInfo);
            expect(loggerSpy).to.have.been.calledWith("warning", "memwatch leak", testInfo);
        });
    });
    describe("handleStats", function() {
        var gaugeSpy;
        var statsdService;
        before("handleStats before", function() {
            statsdService = helper.injector.get('Services.StatsD');
            gaugeSpy = sinon.spy(statsdService, "gauge");
        });
        beforeEach("handleStats beforeEach", function() {
            gaugeSpy.reset();
        });
        after("handleStats after", function() {
            gaugeSpy.restore();
        });

        it("should invoke statsD guage on receiving stats", function() {
            var testStats = {
                estimated_base : 1, //jshint ignore:line
                current_base : 2, //jshint ignore:line
                min : 0,
                max : 5,
                usage_trend : 3  //jshint ignore:line
            };
            statsdService.handleStats(testStats);
            expect(gaugeSpy.getCall(0)).to.have.been.calledWith("memwatch.estimated_base", 1);
            expect(gaugeSpy.getCall(1)).to.have.been.calledWith("memwatch.current_base", 2);
            expect(gaugeSpy.getCall(2)).to.have.been.calledWith("memwatch.min", 0);
            expect(gaugeSpy.getCall(3)).to.have.been.calledWith("memwatch.max", 5);
            expect(gaugeSpy.getCall(4)).to.have.been.calledWith("memwatch.usage_trend", 3);
        });
    });

});

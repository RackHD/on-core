// Copyright 2016, EMC, Inc.

'use strict';

describe('Services.ArgumentHandler', function () {
    var config, LogEvent;

    helper.before();

    before(function () {
        config = helper.injector.get('Services.Configuration');
        LogEvent = helper.injector.get('LogEvent');
        this.subject = helper.injector.get('Services.ArgumentHandler');

    });

    helper.after();

    describe('_getValue', function () {
        var stubConfig;

        before(function() {
            stubConfig = sinon.stub(config, 'get', function(key, val) {
                var obj = {
                    a: 1,
                    b: 'test',
                    c: true
                };
                if (obj.hasOwnProperty(key)) {
                    return obj[key];
                } else {
                    return val;
                }
            });
        });

        after(function() {
            stubConfig.restore();
        });

        it('should return the correct lookup value', function() {
            expect(this.subject._getValue(['a', 'b', 'c'], 'foo')).to.equal(1);
            expect(this.subject._getValue(['x', 'b', 'c'], 'foo')).to.equal('test');
            expect(this.subject._getValue(['x', 'y', 'c'], 'foo')).to.equal(true);
        });

        it('should return default value if all keys don\'t exist', function() {
            expect(this.subject._getValue(['x', 'y', 'z'], 'foo')).to.equal('foo');
        });

        it('should return default value if keys are empty', function() {
            expect(this.subject._getValue([], 'foo')).to.equal('foo');
        });

        it('should return undefined if no default value', function() {
            expect(this.subject._getValue(['x', 'y', 'z'])).to.equal(undefined);
        });

        it('should return default value if keys are not collection', function() {
            var self = this;
            [null, 0, true, {}, undefined].forEach(function(key) {
                expect(self.subject._getValue(key, 'foo')).to.equal('foo');
            });
        });
    });

    describe('start', function() {
        var stubLogEvent;
        var stubGetValue;

        beforeEach(function() {
            stubLogEvent = sinon.stub(LogEvent, 'setColorEnable');
            stubGetValue = sinon.stub(this.subject, '_getValue');
        });

        afterEach(function() {
            stubLogEvent.restore();
            stubGetValue.restore();
        });

        it('should do enable color', function() {
            stubGetValue.withArgs(['color', 'logColorEnable'], false).returns(true);
            this.subject.start();
            expect(stubLogEvent).to.have.callCount(1);
            expect(stubLogEvent).to.have.been.calledWith(true);
        });

        it('should do disable color', function() {
            stubGetValue.withArgs(['color', 'logColorEnable'], false).returns(false);
            this.subject.start();
            expect(stubLogEvent).to.have.callCount(1);
            expect(stubLogEvent).to.have.been.calledWith(false);
        });
    });
});

// Copyright 2015, Renasar Technologies Inc.
/* jshint node:true */

'use strict';
var events = require('events');

describe("ChildProcess", function () {
    var ChildProcess;
    var child;
    var _getPaths;

    helper.before(function (context) {
        // Initial override just yields for core services startup.
        context.childprocess = {
            execFile: sinon.stub()
        };
        return [
            helper.di.simpleWrapper(context.childprocess, 'child_process'),
            helper.require('/spec/mocks/logger.js'),
            helper.require('/lib/common/util')
        ];
    });

    helper.after();

    before("ChildProcess before", function () {
        ChildProcess = helper.injector.get('ChildProcess');
        expect(ChildProcess).to.be.a('function');

        _getPaths = sinon.stub(ChildProcess.prototype, '_getPaths');
        _getPaths.returns([__dirname]);
    });

    beforeEach(function() {
        child = new ChildProcess('child-process-spec.js');
    });

    after("ChildProcess after", function() {
        _getPaths.restore();
    });

    describe("_getPaths", function () {
        it('should return paths', function () {
            var paths = child._getPaths();
            expect(paths).to.be.an('Array');
        });
    });

    describe("_fileExists", function () {
        it('should return true if a file exists', function () {
            expect(child._fileExists(__dirname + "/child-process-spec.js")).to.equal(true);
        });
        it('should return false if a file doesnt exist', function () {
            expect(child._fileExists(__dirname + "/NoFilehere.js")).to.equal(false);
        });
        it('should return false if a file is actually a directory', function () {
            expect(child._fileExists(__dirname)).to.equal(false);
        });
    });

    describe("_parseCommandPath", function () {
        it('should return a fully qualified file if it exists', function () {
            expect(child._parseCommandPath(__dirname + "/child-process-spec.js"))
                .to.be.a('String')
                .to.match(/child-process-spec/);
        });

        it('should return null if the requested command isnt found', function () {
            expect(child._parseCommandPath("NothingHereFile")).to.be.null;
        });

        it('should return a file if found in the paths from _getPaths', function () {
            // stub ChildProcess._getPaths to return the local directory
            child._getPaths = sinon.stub().returns([__dirname]);
            expect(child._parseCommandPath("child-process-spec.js"))
                .to.be.a('String')
                .to.match(/child-process-spec/);
        });
    });

    describe("constructor", function() {
        it("should reject if the command doesn't exist", function () {
            expect(function() {
                new ChildProcess("nonExistantCommand");  // jshint ignore:line
            }).to.throw(/Unable to locate command file.*nonExistantCommand/);
        });

        it("should reject if args are not an array of strings", function () {
            expect(function() {
                new ChildProcess("child-process-spec.js", ['test', 123]);  // jshint ignore:line
            }).to.throw(/args must be an array of strings/);
        });
    });

    describe("_deferred", function() {
        var log;

        before('deferred before', function() {
            var Logger = helper.injector.get('Logger');
            log = sinon.stub(Logger.prototype, 'log');
        });

        beforeEach('deferred beforeEach', function() {
            log.reset();
        });

        after('deferred after', function() {
            log.restore();
        });

        it("should have a _deferred attribute", function() {
            expect(child).to.have.property('_deferred').with.property('promise');
        });

        it("should not resolve twice", function() {
            child.resolve();
            child.resolve();
            expect(log).to.have.been.calledOnce;
            expect(log).to.have.been.calledWith(
                "warning", "ChildProcess promise has already been resolved");
        });

        it("should not reject twice", function() {
            child.reject();
            child.reject();
            expect(log).to.have.been.calledOnce;
            expect(log).to.have.been.calledWith(
                "warning", "ChildProcess promise has already been rejected");
        });
    });

    describe("run", function () {
        var log;

        before("ChildProcess.run before", function () {
            var Logger = helper.injector.get('Logger');
            log = sinon.stub(Logger.prototype, 'log');
        });

        beforeEach("ChildProcess.run beforeEach", function() {
            log.reset();
        });

        after("ChildProcess.run after", function() {
            log.restore();
        });

        it("should work and call inner _run()", function() {
            child._run = function() {
                child._deferred.resolve();
            };
            var _runSpy = sinon.spy(child, '_run');

            return child.run({ retries: 1 })
            .then(function() {
                expect(_runSpy).to.have.been.calledOnce;
            });
        });

        it("should fail on max retries", function() {
            child._run = function() {
                child._deferred.reject(new Error('test failure'));
            };
            var _runSpy = sinon.spy(child, '_run');

            return child.run({ retries: 2 })
            .catch(function(e) {
                expect(e).to.deep.equal(new Error('test failure'));
                expect(_runSpy).to.have.been.calledThrice;
            });
        });

        it("should not retry if retries is not set", function(done) {
            child._run = function() {
                child._deferred.reject(new Error('test failure'));
            };
            var _runSpy = sinon.spy(child, '_run');

            // Use done() because if the promise is fulfilled that is a failure
            // case for this test. Assert that we hit this catch block.
            return child.run()
            .catch(function(e) {
                expect(e).to.deep.equal(new Error('test failure'));
                expect(_runSpy).to.have.been.calledOnce;
                done();
            });
        });

        it("should be able to succeed after retries", function() {
            var retrycount = 0;
            child._run = function() {
                if (retrycount === 2) {
                    child._deferred.resolve();
                } else {
                    retrycount += 1;
                    child._deferred.reject(new Error('test failure'));
                }
            };
            var _runSpy = sinon.spy(child, '_run');

            return child.run({ retries: 2 })
            .then(function() {
                expect(_runSpy).to.have.been.calledThrice;
            });
        });

        it("should run a call execFile with the local file", function () {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, undefined, "stdout result", undefined);

            return child.run().should.be.fulfilled.then(function() {
                expect(execFileStub.called).to.equal(true);
            });
        });

        it("should run and return a rejected promise if returned an error w/ code", function () {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, {code: -1}, undefined, "stderr result");

            return child.run().should.be.rejected.then(function () {
                expect(execFileStub.called).to.equal(true);
            });
        });

        it("on emit of 'close' from spawnprocess, should log and report killed", function() {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, undefined, "stdout result", undefined);

            return child.run().then(function() {
                mockSpawnedProcess.emit('close', -1, 'someSignal');
            }).should.be.fulfilled.then(function () {
                expect(execFileStub.called).to.equal(true);
                expect(log.called).to.equal(true);
                expect(child.hasBeenKilled).to.equal(true);
            });
        });

        it("on emit of 'error' from spawnprocess, should log and report killed", function() {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, undefined, "stdout result", undefined);

            return child.run().then(function() {
                mockSpawnedProcess.emit('error', -1, 'someSignal');
            }).should.be.fulfilled.then(function () {
                expect(execFileStub.called).to.equal(true);
                expect(log.called).to.equal(true);
            });
        });
    });

    describe("killSafe", function () {
        var log;

        before("ChildProcess.run before", function () {
            var Logger = helper.injector.get('Logger');
            log = sinon.stub(Logger.prototype, 'log');
        });

        beforeEach("ChildProcess.run beforeEach", function() {
            log.reset();
        });

        after("ChildProcess.run after", function() {
            log.restore();
        });

        it("should not run after killSafe() is called if it is called before " +
                "run is called", function () {
            child.killSafe('foo');
            expect(child.run()).to.be.rejectedWith(ChildProcess.JobKilledError);
        });

        it("should not kill the process if it has already been killed", function () {
            child.hasBeenKilled = true;
            child.spawnInstance = {
                kill: sinon.stub()
            };
            child.killSafe('foo');
            expect(child.spawnInstance.kill).to.not.have.been.called;
        });

        it("should invoke the kill function", function () {
            var killStub = sinon.stub();
            child.hasBeenKilled = false;
            child.spawnInstance = { kill: killStub };
            child.killSafe('foo');
            expect(killStub.called).to.be.equal(true);
            expect(log.called).to.equal(false);
        });
    });
});

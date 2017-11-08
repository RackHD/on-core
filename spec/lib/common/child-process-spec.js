// Copyright 2015, EMC, Inc.


'use strict';
var events = require('events');

describe("ChildProcess", function () {
    var ChildProcess;
    var child;
    var _getPaths;
    var _getPathsOrig;
    var Logger;
    var log;

    helper.before(function (context) {
        // Initial override just yields for core services startup.
        context.childprocess = {
            execFile: sinon.stub()
        };

        return helper.di.simpleWrapper(context.childprocess, 'child_process');
    });

    helper.after();

    before("ChildProcess before", function () {
        ChildProcess = helper.injector.get('ChildProcess');
        expect(ChildProcess).to.be.a('function');
        _getPathsOrig = ChildProcess.prototype._getPaths;
        Logger = helper.injector.get('Logger');
    });

    beforeEach(function() {
        _getPaths = this.sandbox.stub(ChildProcess.prototype, '_getPaths');
        _getPaths.returns([__dirname]);
        child = new ChildProcess('child-process-spec.js', null, null, [1]);
        log = this.sandbox.stub(Logger.prototype, 'log');
    });

    describe("_getPaths", function () {
        var origpath = process.env.path;
        var origPath = process.env.Path;
        var origPATH = process.env.PATH;

        function assertPaths(paths) {
            expect(paths).to.be.an('Array');
            expect(paths[0]).to.equal('a/b');
            expect(paths[1]).to.equal('c/d');
            expect(paths[2]).to.equal('e/f');
        }

        afterEach(function() {
            process.env.path = origpath;
            process.env.Path = origPath;
            process.env.PATH = origPATH;
        });

        it('should split process.env.path', function () {
            process.env.path = 'a/b:c/d:e/f';
            assertPaths(_getPathsOrig());
        });

        it('should split process.env.Path', function () {
            process.env.path = '';
            process.env.Path = 'a/b:c/d:e/f';
            assertPaths(_getPathsOrig());
        });

        it('should split process.env.PATH', function () {
            process.env.path = '';
            process.env.Path = '';
            process.env.PATH = 'a/b:c/d:e/f';
            assertPaths(_getPathsOrig());
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
            child._getPaths = this.sandbox.stub().returns([__dirname]);
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

        it("should reject if code are not an array of numbers", function () {
            expect(function() {
                new ChildProcess("child-process-spec.js", null, null, 1);  // jshint ignore:line
            }).to.throw(/.*\(\[number\]\) is required/);
        });

    });

    describe("_deferred", function() {
        beforeEach('deferred beforeEach', function() {
            child.createOwnDeferred();
        });

        it("should have a _deferred attribute", function() {
            expect(child).to.have.property('_deferred').with.property('isPending');
        });

        it("should not resolve twice", function() {
            child.resolve();
            child.resolve();
            expect(log).to.have.been.calledOnce;
            expect(log).to.have.been.calledWith(
                "error", "ChildProcess promise has already been resolved");
        });

        it("should not reject twice", function() {
            child.reject();
            child.reject();
            expect(log).to.have.been.calledOnce;
            expect(log).to.have.been.calledWith(
                "error", "ChildProcess promise has already been rejected");
        });
    });

    describe("run", function () {
        it("should work and call inner _run()", function() {
            child._run = function() {
                child._resolve();
            };
            var _runSpy = this.sandbox.spy(child, '_run');

            return child.run({ retries: 1, delay: 0 })
            .then(function() {
                expect(_runSpy).to.have.been.calledOnce;
            });
        });

        it("should fail on max retries", function() {
            child._run = function() {
                child._reject(new Error('test failure'));
            };
            var _runSpy = this.sandbox.spy(child, '_run');

            return child.run({ retries: 2, delay: 0 })
            .catch(function(e) {
                expect(e).to.deep.equal(new Error('test failure'));
                expect(_runSpy).to.have.been.calledThrice;
            });
        });

        it("should not retry if retries is not set", function(done) {
            child._run = function() {
                child._reject(new Error('test failure'));
            };
            var _runSpy = this.sandbox.spy(child, '_run');

            // Use done() because if the promise is fulfilled that is a failure
            // case for this test. Assert that we hit this catch block.
            child.run()
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
                    child._resolve();
                } else {
                    retrycount += 1;
                    child._reject(new Error('test failure'));
                }
            };
            var _runSpy = this.sandbox.spy(child, '_run');

            return child.run({ retries: 2, delay: 0 })
            .then(function() {
                expect(_runSpy).to.have.been.calledThrice;
            });
        });

        it("should retry with exponential backoff delay", function() {
            var retries = 5;
            var delay = 1;
            child._run = function() {
                child._reject(new Error('test failure'));
            };
            var _runSpy = this.sandbox.spy(child, '_run');
            var _retrySpy = this.sandbox.spy(child, '_runWithRetries');

            return child.run({ retries: retries, delay: delay })
            .catch(function(e) {
                expect(e).to.deep.equal(new Error('test failure'));
                expect(_runSpy.callCount).to.equal(retries + 1);
                expect(_retrySpy.callCount).to.equal(retries + 1);
                expect(_retrySpy.getCall(0)).to.have.been.calledWith(0, 1, 5);
                expect(_retrySpy.getCall(1)).to.have.been.calledWith(1, 2, 5);
                expect(_retrySpy.getCall(2)).to.have.been.calledWith(2, 4, 5);
                expect(_retrySpy.getCall(3)).to.have.been.calledWith(3, 8, 5);
                expect(_retrySpy.getCall(4)).to.have.been.calledWith(4, 16, 5);
                expect(_retrySpy.getCall(5)).to.have.been.calledWith(5, 32, 5);
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

        it("should run and return a rejected promise if no matched exit code", function (done) {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, {code: -1}, undefined, "stderr result");

            child.run().then(function() {
                done(new Error('Expect job to fail'));
            })
            .catch(function(e) {
                try {
                    expect(e).to.deep.equal({code: -1});
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it("should run and return a resolved promise if the exit code matches", function () {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, {code: 1}, undefined, "stderr result");

            return child.run().then(function(ret) {
                expect(execFileStub).to.have.been.called;
                expect(ret).to.deep.equal({stdout: undefined, stderr: "stderr result"});
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
        it("should not run after killSafe() is called if it is called before " +
                "run is called", function () {
            child.killSafe('foo');
            expect(child.run()).to.be.rejectedWith(ChildProcess.JobKilledError);
        });

        it("should not kill the process if it has already been killed", function () {
            child.hasBeenKilled = true;
            child.spawnInstance = {
                kill: this.sandbox.stub()
            };
            child.killSafe('foo');
            expect(child.spawnInstance.kill).to.not.have.been.called;
        });

        it("should invoke the kill function", function () {
            var killStub = this.sandbox.stub();
            child.hasBeenKilled = false;
            child.spawnInstance = { kill: killStub };
            child.killSafe('foo');
            expect(killStub.called).to.be.equal(true);
            expect(log.called).to.equal(false);
        });
    });
});

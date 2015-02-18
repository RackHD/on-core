// Copyright 2015, Renasar Technologies Inc.
/* jshint node:true */

'use strict';
var events = require('events');

describe("ChildProcess", function () {

    var ChildProcess;

    helper.before(function (context) {
        // Initial override just yields for core services startup.
        context.childprocess = {
            execFile: sinon.stub()
        };
        return [
            helper.di.simpleWrapper(context.childprocess, 'child_process'),
            helper.require('/spec/mocks/logger.js')
        ];
    });

    helper.after();

    before("ChildProcess before", function () {
        ChildProcess = helper.injector.get('ChildProcess');
        expect(ChildProcess).to.be.a('function');
    });

    describe("_getPaths", function () {
        it('should return paths', function () {
            var newProcess = new ChildProcess();
            var paths = newProcess._getPaths();
            expect(paths).to.be.an('Array');
        });
    });

    describe("_fileExists", function () {
        it('should return true if a file exists', function () {
            var newProcess = new ChildProcess();
            expect(newProcess._fileExists(__dirname + "/child-process-spec.js")).to.equal(true);
        });
        it('should return fasle if a file doesnt exist', function () {
            var newProcess = new ChildProcess();
            expect(newProcess._fileExists(__dirname + "/NoFilehere.js")).to.equal(false);
        });
        it('should return fasle if a file is actually a directory', function () {
            var newProcess = new ChildProcess();
            expect(newProcess._fileExists(__dirname)).to.equal(false);
        });
    });

    describe("_parseCommandPath", function () {
        it('should return a fully qualified file if it exists', function () {
            var newProcess = new ChildProcess();
            expect(newProcess._parseCommandPath(__dirname + "/child-process-spec.js"))
                .to.be.a('String')
                .to.match(/child-process-spec/);
        });

        it('should return null if the requested command isnt found', function () {
            var newProcess = new ChildProcess();
            expect(newProcess._parseCommandPath("NothingHereFile")).to.be.null;
        });

        it('should return a file if found in the paths from _getPaths', function () {
            var newProcess = new ChildProcess();
            // stub ChildProcess._getPaths to return the local directory
            newProcess._getPaths = sinon.stub().returns([__dirname]);
            expect(newProcess._parseCommandPath("child-process-spec.js"))
                .to.be.a('String')
                .to.match(/child-process-spec/);
        });
    });

    describe("run", function () {
        var newProcess;
        var loggerSpy;

        before("ChildProcess.run before", function () {
            newProcess = new ChildProcess();
            newProcess._getPaths = sinon.stub().returns([__dirname]);
            var logger = helper.injector.get('Logger').initialize();
            loggerSpy = sinon.spy(logger, 'log');

        });

        beforeEach("run beforeEach", function() {
            loggerSpy.reset();
        });

        it('should do return a rejected promise if the command doesnt exist', function () {
            return newProcess.run("nonExistanceCommand").should.be.rejected;
        });

        it('should do return a rejected promise if the args arent an array of strings', function () {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, undefined, "stdout result", undefined);

            return newProcess.run("child-process-spec.js", [123], {}, 0).should.be.rejected;
        });

        it("should run a call execFile with the local file", function () {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, undefined, "stdout result", undefined);

            return newProcess.run("child-process-spec.js").should.be.fulfilled.then(function () {
                expect(execFileStub.called).to.equal(true);
            });
        });

        it("should run and return a rejected promise if returned an error w/ code", function () {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, {code: -1}, undefined, "stderr result");
            return newProcess.run("child-process-spec.js").should.be.rejected.then(function () {
                expect(execFileStub.called).to.equal(true);
            });
        });

        it("on emit of 'close' from spawnprocess, should log and report killed", function() {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, undefined, "stdout result", undefined);

            return newProcess.run("child-process-spec.js").then(function() {
                mockSpawnedProcess.emit('close', -1, 'someSignal');
            }).should.be.fulfilled.then(function () {
                expect(execFileStub.called).to.equal(true);
                expect(loggerSpy.called).to.equal(true);
                expect(newProcess.hasBeenKilled).to.equal(true);
            });
        });

        it("on emit of 'error' from spawnprocess, should log and report killed", function() {
            var mockSpawnedProcess = new events.EventEmitter();
            var execFileStub = this.childprocess.execFile;
            execFileStub.returns(mockSpawnedProcess)
                .callsArgWith(3, undefined, "stdout result", undefined);

            return newProcess.run("child-process-spec.js").then(function() {
                mockSpawnedProcess.emit('error', -1, 'someSignal');
            }).should.be.fulfilled.then(function () {
                expect(execFileStub.called).to.equal(true);
                expect(loggerSpy.called).to.equal(true);
            });
        });
    });

    describe("killSafe", function () {
        it("will just emit a log message if the process hasn't been run", function () {
            var newProcess = new ChildProcess();
            newProcess.killSafe('foo');
        });
        it("will log message if the process has already been killed", function () {
            var newProcess = new ChildProcess();
            newProcess.hasBeenKilled = true;
            newProcess.killSafe('foo');
        });
        it("will log message if the process doesn't have a spawned instance", function () {
            var newProcess = new ChildProcess();
            newProcess.hasRun = true;
            newProcess.hasBeenKilled = true;
            newProcess.killSafe('foo');
        });
        it("will log message if the spawned instance for the process doesn't have a kill function", function () {
            var newProcess = new ChildProcess();
            newProcess.hasRun = true;
            newProcess.hasBeenKilled = true;
            newProcess.spawnInstance = {};
            newProcess.killSafe('foo');
        });
        it("will log message if the spawned instance for the process doesn't have a kill function", function () {
            var killStub = sinon.stub();
            var newProcess = new ChildProcess();
            newProcess.hasRun = true;
            newProcess.hasBeenKilled = false;
            newProcess.spawnInstance = { kill: killStub };
            newProcess.killSafe('foo');
            expect(killStub.called).to.be.equal(true);
        });
    });
});
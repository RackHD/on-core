// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ChildProcessFactory;

ChildProcessFactory.$provide = 'ChildProcess';
ChildProcessFactory.$inject = [
    'child_process',
    'Errors',
    'Logger',
    'Assert',
    'Util',
    'Promise',
    'Constants',
    '_',
    'fs',
    'path'
];

/**
 * childProcessFactory returns a ChildProcess constructor
 * @param {Q} Q Promise Library
 * @param {Logger} Logger module
 * @param {Object} assert assertion module
 * @param {Object} _ lodash module
 * @private
 */
function ChildProcessFactory (
    nodeChildProcess,
    Errors,
    Logger,
    assert,
    util,
    Promise,
    Constants,
    _,
    fs,
    path
) {
    var logger = Logger.initialize(ChildProcessFactory);

    /**
     * ChildProcess provides a promise based mechanism to run shell commands
     * in a fairly secure manner.
     * @constructor
     */
    function ChildProcess (command, args, env, code, maxBuffer) {
        var self = this;

        assert.string(command);

        self.command = command;
        self.file = self._parseCommandPath(self.command);
        self.args = args;
        self.environment = env || {};
        self.exitCode = code || 0;
        self.maxBuffer = maxBuffer || Constants.ChildProcess.MaxBuffer;

        if (!self.file) {
            throw new Error('Unable to locate command file (' + self.command +').');
        }
        if (!_.isEmpty(self.args)) {
            try {
                assert.arrayOfString(self.args, 'ChildProcess command arguments');
            } catch (e) {
                throw new Error('args must be an array of strings');
            }
        }

        self.hasBeenKilled = false;
        self.hasBeenCancelled = false;
        self.spawnInstance = undefined;
    }

    ChildProcess.prototype.createOwnDeferred = function() {
        var self = this;
        self._deferred = new Promise(function(resolve, reject) {
            self._resolve = resolve;
            self._reject = reject;
        });
    };

    ChildProcess.prototype.resolve = function(result) {
        if (!this._deferred.isPending()) {
            logger.error("ChildProcess promise has already been resolved");
            return;
        } else {
            this._resolve(result);
        }
    };

    ChildProcess.prototype.reject = function(error) {
        if (!this._deferred.isPending()) {
            logger.error("ChildProcess promise has already been rejected");
            return;
        } else {
            this._reject(error);
        }
    };

    ChildProcess.prototype.killSafe = function (signal) {
        if (!this.hasBeenKilled && this.spawnInstance && _.isFunction(this.spawnInstance.kill)) {
            this.spawnInstance.kill(signal);
        }
        this.hasBeenCancelled = true;
    };

    /**
     * Runs the given command.
     * @param  {String} command File to run, with path or without.
     * @param  {String[]} args    Arguments to the file.
     * @param  {Object} env     Optional environment variables to provide.
     * @param  {Integer} code   Desired exit code, defaults to 0.
     * @return {Promise}        A promise fulfilled with the stdout, stderr of
     * a successful command.
     */
    ChildProcess.prototype._run = function () {
        var self = this;

        if (self.hasBeenCancelled) {
            self.reject(new Errors.JobKilledError("ChildProcess job has been cancelled", {
                command: self.command,
                argv: self.args
            }));
            return;
        }

        self.hasBeenKilled = false;

        var options = {
            env: self.environment,
            maxBuffer: self.maxBuffer
        };

        self.spawnInstance = nodeChildProcess.execFile(
                self.file, self.args, options, function (error, stdout, stderr) {

            if (error && error.code !== self.exitCode) {
                self.hasBeenKilled = true;
                logger.error('Error Running ChildProcess.', {
                    file: self.file,
                    argv: self.args,
                    stdout: stdout,
                    stderr: stderr,
                    error: error
                });

                self.reject(error);
            } else {
                self.hasBeenKilled = true;
                self.resolve({
                    stdout: stdout,
                    stderr: stderr
                });
            }
        })
        .on('close', function(code, signal) {
            if (signal) {
                logger.warning("Child process received closing signal:", {
                    signal: signal,
                    argv: self.args
                });
            }
            self.hasBeenKilled = true;
        })
        .on('error', function(code, signal) {
            logger.error("Child process received closing signal but has " +
                "already been closed!!!", {
                signal: signal,
                argv: self.args
            });
        });
    };

    ChildProcess.prototype._runWithRetries = function(retryCount, delay, retries) {
        var self = this;

        // Max out exponential backoff to 60 seconds.
        delay = delay > 60000 ? 60000 : delay;

        if (!self._deferred) {
            self.createOwnDeferred();
        }

        self._run();

        return self._deferred.catch(function(e) {
            if (e instanceof Errors.JobKilledError) {
                throw e;
            } else if (retryCount < retries) {
                logger.debug("Retrying ChildProcess command.", {
                    file: self.file,
                    args: self.args
                });
                // Create new deferred promise in here instead of above, in case we receive an
                // external cancellation during the below delay, so we don't
                // try to reject using the previous deferred object.
                self.createOwnDeferred();
                return Promise.delay(delay)
                .then(function() {
                    return self._runWithRetries(retryCount + 1, delay * 2, retries);
                });
            } else {
                throw e;
            }
        });
    };

    ChildProcess.prototype.run = function(options) {
        options = options || {};
        options.retries = options.retries || 0;
        if (options.delay !== 0) {
            options.delay = options.delay || 500;
        }

        return this._runWithRetries(0, options.delay, options.retries);
    };

    /**
     * Internal method to identify the path to the command file.  It's essentially
     * unix which in JavaScript.
     * @private
     */
    ChildProcess.prototype._parseCommandPath = function _parseCommandPath (command) {
        var self = this;

        if (self._fileExists(command)) {
            return command;
        } else {
            var found = _.some(self._getPaths(), function (current) {
                var target = path.resolve(current + '/' + command);

                if (self._fileExists(target)) {
                    command = target;

                    return true;
                }
            });

            return found ? command : null;
        }
    };

    /**
     * Internal method to verify a file exists and is not a directory.
     * @private
     */
    ChildProcess.prototype._fileExists = function _fileExists (file) {
        return fs.existsSync(file) && !fs.statSync(file).isDirectory();
    };

    /**
     * Internal method to get an array of directories in the users path.
     * @private
     */
    ChildProcess.prototype._getPaths = function _getPaths () {
        var path = process.env.path || process.env.Path || process.env.PATH;
        return path.split(':');
    };

    return ChildProcess;
}

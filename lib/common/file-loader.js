// Copyright 2015, EMC, Inc.

'use strict';

module.exports = fileLoaderFactory;

fileLoaderFactory.$provide = 'FileLoader';
fileLoaderFactory.$inject = [
    'Assert',
    'Promise',
    '_',
    'fs',
    'path'
];

function fileLoaderFactory(assert, Promise, _, nodeFs, path) {
    var fs = Promise.promisifyAll(nodeFs);

    /**
     * FileLoad provides convenience methods around loading files from disk
     * into memory for use by consumers.
     */
    function FileLoader() {
    }

    /**
     * The put function writes the contents to the given file.
     * @param  {string} file File name.
     * @param  {string|buffer} contents File Contents.
     * @return {Promise} Resolves on completion.
     */
    FileLoader.prototype.put = function (file, contents) {
        assert.string(file);
        assert.ok(contents);

        return fs.writeFileAsync(file, contents);
    };

    /**
     * The get function reads the contents of the given file and returns them
     * via a promise.
     * @param  {string} file File to read.
     * @return {Promise} A promise fulfilled with the contents of the file.
     */
    FileLoader.prototype.get = function (file) {
        assert.string(file);

        return fs.readFileAsync(file, 'utf-8');
    };

    /**
     * The getAll function reads the contents of all files in the given directory
     * and returns an object keyed by the file basename with a value of the file
     * contents.
     * @param  {string} directory The directory to source files from.
     * @return {Promise} An object with key/value pairs representing the files located
     * in the given directory.
     */
    FileLoader.prototype.getAll = function (directory, recursive) {
        assert.string(directory);

        // List all files in the directory.
        var accumulator = {};
        recursive = recursive || false;
        var readDir = function(dirName) {
            return fs.readdirAsync(dirName).map(function (fileName) {
                var pathName = dirName + '/' + fileName;
                return fs.statAsync(pathName).then(function(stat) {
                    return stat.isDirectory() ? (recursive ? readDir(pathName) : null) : pathName;
                });
            })
            .reduce(function (a, b) {
                return a.concat(b);
            }, []);
        };

        return readDir(directory).then(function(v) {
            return _(v).compact().value();
        })
        .map(function(filename) {
            return fs.readFileAsync(filename)
                .then(function(contents) {
                    accumulator[path.basename(filename)] = contents;
                });
        })
        .then(function() {
            return accumulator;
        });
    };

    return FileLoader;
}

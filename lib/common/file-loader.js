// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true, newcap: false */
'use strict';

var di = require('di'),
    fs = require('fs'),
    path = require('path');

module.exports = fileLoaderFactory;

di.annotate(fileLoaderFactory, new di.Provide('FileLoader'));
di.annotate(fileLoaderFactory,
    new di.Inject(
        'Assert',
        'Q',
        '_'
    )
);

function fileLoaderFactory(assert, Q, _) {
    /**
     * FileLoad provides convenience methods around loading files from disk
     * into memory for use by consumers.
     */
    function FileLoader() {
    }

    /**
     * The get function reads the contents of the given file and returns them
     * via a promise.
     * @param  {string} file File to read.
     * @return {Promise} A promise fulfilled with the contents of the file.
     */
    FileLoader.prototype.get = function (file) {
        assert.string(file);

        return Q.nfcall(fs.readFile, file, 'utf-8');
    };

    /**
     * The getAll function reads the contents of all files in the given directory
     * and returns an object keyed by the file basename with a value of the file
     * contents.
     * @param  {string} directory The directory to source files from.
     * @return {Promise} An object with key/value pairs representing the files located
     * in the given directory.
     */
    FileLoader.prototype.getAll = function (directory) {
        assert.string(directory);

        // List all files in the directory.
        return Q.nfcall(fs.readdir, directory).then(function (files) {
            // Map out an array of promises to read each file into a buffer;
            var promises = _.map(files, function (file) {
                return Q.nfcall(fs.readFile, directory + '/' + file, 'utf-8');
            });

            // Resolve all promises then process them upon completion.
            return Q.all(promises).then(function (contents) {
                // Iterate through the list of files and apply the contents to the
                // accumulator which is the return value for the getAll method.
                return _.reduce(files, function (accumulator, value, index) {
                    accumulator[path.basename(value)] = contents[index];

                    return accumulator;
                }, {});
            });
        });
    };

    return FileLoader;
}

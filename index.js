// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var _ = require('lodash');

module.exports = function (di, directory) {
    var helper = require('./lib/di')(di, directory || __dirname);

    return {
        helper: helper,
        injectables: _.flatten(
            [
                // NPM Packages
                helper.simpleWrapper(_, '_'),
                helper.requireWrapper('q', 'Q'),
                helper.requireWrapper('rx', 'Rx'),
                helper.requireWrapper('nconf'),
                helper.requireWrapper('waterline', 'Waterline'),
                helper.requireWrapper('waterline-criteria', 'WaterlineCriteria'),
                helper.requireWrapper('sails-mongo', 'MongoAdapter'),
                helper.requireWrapper('sails-disk', 'DiskAdapter'),
                helper.requireWrapper('amqplib', 'amqp'),
                helper.requireWrapper('domain', 'domain'),
                helper.requireWrapper('node-uuid', 'uuid'),
                helper.requireWrapper('stack-trace', 'stack-trace'),
                helper.requireWrapper('colors/safe', 'colors'),
                helper.requireWrapper('prettyjson', 'prettyjson'),
                helper.requireWrapper('lru-cache', 'lru-cache'),
                helper.requireWrapper('memwatch', 'memwatch'),
                helper.requireWrapper('node-statsd', 'node-statsd'),
                helper.requireWrapper('validate.js', 'validate'),
                helper.requireWrapper('validator', 'validator'),
                helper.requireWrapper('assert-plus', 'assert-plus'),
                helper.requireWrapper('ejs', 'ejs'),
                helper.requireWrapper('anchor', 'anchor'),
                helper.requireWrapper('fs', 'fs'),
                helper.requireWrapper('child_process', 'child_process'),

                // Glob Requirables
                helper.requireGlob(__dirname + '/lib/common/*.js'),
                helper.requireGlob(__dirname + '/lib/models/*.js'),
                helper.requireGlob(__dirname + '/lib/protocol/*.js'),
                helper.requireGlob(__dirname + '/lib/serializables/*.js'),
                helper.requireGlob(__dirname + '/lib/services/*.js')
            ]
        )
    };
};

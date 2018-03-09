// Copyright 2015, EMC, Inc.

//////
'use strict';

var _ = require('lodash'),
    dependencyInjection = require('di');

require('./lib/extensions');

module.exports = function (di, directory) {
    di = di || dependencyInjection;
    directory = directory || __dirname;

    var helper = require('./lib/di')(di, directory);

    var injectables = _.flattenDeep(
        [
            // NPM Packages
            helper.simpleWrapper(_, '_'),
            helper.requireWrapper('bluebird', 'Promise'),
            helper.requireWrapper('rx', 'Rx'),
            helper.requireWrapper('nconf'),
            helper.requireWrapper('waterline', 'Waterline'),
            helper.requireWrapper('waterline-criteria', 'WaterlineCriteria'),
            helper.requireWrapper('sails-mongo', 'MongoAdapter'),
            helper.requireWrapper('sails-postgresql', 'PostgreSQLAdapter'),
            helper.requireWrapper('amqp', 'amqp'),
            helper.requireWrapper('domain', 'domain'),
            helper.requireWrapper('node-uuid', 'uuid'),
            helper.requireWrapper('stack-trace', 'stack-trace'),
            helper.requireWrapper('colors/safe', 'colors'),
            helper.requireWrapper('prettyjson', 'prettyjson'),
            helper.requireWrapper('lru-cache', 'lru-cache'),
            helper.requireWrapper('node-statsd', 'node-statsd'),
            helper.requireWrapper('validate.js', 'validate'),
            helper.requireWrapper('validator', 'validator'),
            helper.requireWrapper('assert-plus', 'assert-plus'),
            helper.requireWrapper('ejs', 'ejs'),
            helper.requireWrapper('hogan.js', 'Hogan'),
            helper.requireWrapper('fs', 'fs'),
            helper.requireWrapper('path', 'path'),
            helper.requireWrapper('child_process', 'child_process'),
            helper.requireWrapper('anchor', 'anchor'),
            helper.requireWrapper('jsonschema', 'jsonschema'),
            helper.simpleWrapper(console, 'console'),
            helper.simpleWrapper(require('eventemitter2').EventEmitter2, 'EventEmitter'),
            helper.requireWrapper('nanoid', 'nanoid'),
            helper.requireWrapper('crypto', 'crypto'),
            helper.requireWrapper('crypt3/sync', 'crypt'),
            helper.requireWrapper('util', 'util'),
            helper.requireWrapper('pluralize', 'pluralize'),
            helper.requireWrapper('always-tail', 'Tail'),
            helper.requireWrapper('flat', 'flat'),
            helper.requireWrapper('ajv', 'Ajv'),
            helper.requireWrapper('url', 'url'),

            // Glob Requirables
            helper.requireGlob(__dirname + '/lib/common/*.js'),
            helper.requireGlob(__dirname + '/lib/models/*.js'),
            helper.requireGlob(__dirname + '/lib/protocol/*.js'),
            helper.requireGlob(__dirname + '/lib/serializables/*.js'),
            helper.requireGlob(__dirname + '/lib/services/*.js')
        ]
    );

    var injector = new di.Injector(injectables);

    // Run the common arguments handler
    var argHandler = injector.get('Services.ArgumentHandler');
    argHandler.start();

    return {
        di: di,
        helper: helper,
        injectables: injectables,
        workflowInjectables: _.flatten([
            helper.requireGlob(__dirname + '/lib/workflow/stores/*.js'),
            helper.requireGlob(__dirname + '/lib/workflow/messengers/*.js'),
            helper.requireGlob(__dirname + '/lib/workflow/*.js'),
        ])
    };
};

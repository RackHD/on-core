/*globals global,require,__dirname */
'use strict';

var path = require('path');

/**
 *  set up global request mocking library supertest as request
 */
global.request = require('supertest');

/**
 *  set up global sinon for use as a spy and ensure initialized before
 *  invoking sinon-chai extension to chai.
 */
global.sinon = require('sinon');
global.sinonPromise = require('sinon-promise')(global.sinon);

/**
 *  set up global chai for testing
 */
global.chai = require('chai');
global.chai.use(require("chai-as-promised"));
global.chai.use(require("sinon-chai"));

/**
 *  set up global expect for testing
 */
global.expect = chai.expect; // jshint ignore:line

/**
 *  set up global should for testing
 */
global.should = chai.should(); // jshint ignore:line

/**
 *  set up di for testing
 */
var di = require('di');
var dihelper = require('../lib/di')(di, __dirname);

/**
 *  set up global lodash as _ for testing
 */
global._ = require('lodash');

global.helper = {

/**
 * Helper for requiring files based on the cwd which is the root of the project.
 */
    require: function (file) {
        return require(this.relativeToRoot(file));
    },

/**
 * Helper to generate a full path relative to the root directory.
 */
    relativeToRoot: function (file) {
        return path.normalize(process.cwd() + file);
    },
/**
 * Most commonly used classes / modules, override or extend as needed
 * with child injector
 */
    baseInjector: new di.Injector(_.flatten([ // jshint ignore:line
        // NPM Packages
        dihelper.requireWrapper('lodash', '_'),
        dihelper.requireWrapper('q', 'Q'),
        dihelper.requireWrapper('nconf'),
        dihelper.requireWrapper('waterline', 'Waterline'),
        dihelper.requireWrapper('sails-mongo', 'MongoAdapter'),
        dihelper.requireWrapper('amqplib', 'amqp'),
        dihelper.requireWrapper('domain', 'domain'),
        dihelper.requireWrapper('node-uuid', 'uuid'),
        dihelper.requireWrapper('stack-trace', 'stack-trace'),
        dihelper.requireWrapper('colors/safe', 'colors'),
        dihelper.requireWrapper('prettyjson', 'prettyjson'),
        dihelper.requireWrapper('lru-cache', 'lru-cache'),

        // Glob Requirables
        dihelper.requireGlob(__dirname + '/../lib/common/*.js'),
        dihelper.requireGlob(__dirname + '/../lib/models/*.js'),
        dihelper.requireGlob(__dirname + '/../lib/protocol/**/*.js'),
        dihelper.requireGlob(__dirname + '/../lib/services/*.js')

])),

    initializeWaterline: function (injector) {
        if (arguments.length === 0) {
            injector = this.baseInjector;
        }

        var waterline = injector.get('Services.Waterline');
        var config = injector.get('Services.Configuration');

        config.set('mongo', {
            adapter: 'mongo',
            host: 'localhost',
            port: 27017,
            database: 'renasar-pxe-test',
            user: '',
            password: ''
        });

        return waterline.start();
    },

    closeWaterline: function (injector) {
        if (arguments.length === 0) {
            injector = this.baseInjector;
        }

        var waterline = injector.get('Services.Waterline');

        return waterline.stop();
    },

    dropAndReinitialize: function(injector) {
        if (arguments.length === 0) {
            injector = this.baseInjector;
        }
        var Q = injector.get('Q');
        return this.initializeWaterline(injector).then(function (waterline) { // jshint ignore:line
            /* drop doesn't actually return a promise, but leaving this Q.all in here in case
             * we need to switch to using destroy() */
            return Q.all(_.map(waterline, function (collection) { // jshint ignore:line
                if (typeof collection.drop === 'function') {
                    return collection.drop({});
                }
            })).then(function () {
                return waterline;
            });
        });
    }
};


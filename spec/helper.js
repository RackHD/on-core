/*globals global,require,__dirname */
'use strict';

var path = require('path');

var longjohn = require('longjohn');

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
global.chai.use(require('chai-as-promised'));
global.chai.use(require('sinon-chai'));

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
global.Q = require('Q');

global.helper = {

/**
 * Helper for requiring files based on the cwd which is the root of the project.
 */
    require: function (file) {
        return require(this.relativeToRoot(file));
    },

/**
 * Helper for glob requiring files based on the cwd which is the root of the project.
 */
    requireGlob: function (pathPattern) {
        return dihelper.requireGlob(this.relativeToRoot(pathPattern));
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
    di: dihelper,

    injector: new di.Injector(require('../index')(di, '..').injectables),

    start: function (injector) {
        var self = this;

        if (injector) {
            this.injector = injector;
        }

        this.injector.get(
            'Services.Configuration'
        ).set('mongo', {
            host: 'localhost',
            port: 27017,
            database: 'renasar-pxe-test',
            user: '',
            password: ''
        }).set(
            'amqp', 'amqp://localhost'
        );

        return this.injector.get('Services.Core').start().then(function (core) {
            self.core = core;
        });
    },

    reset: function () {
        var waterline = this.injector.get('Services.Waterline'),
            Q = this.injector.get('Q'),
            _ = this.injector.get('_');

        return Q.all(
            _.map(waterline, function (collection) {
                if (typeof collection.drop === 'function') {
                    return collection.drop({});
                }
            })
        );
    },

    stop: function () {
        if (this.core) {
            return this.core.stop();
        } else {
            return this.injector.get('Services.Core').stop();
        }
    },

    before: function (callback) {
        before(function () {
            if (_.isFunction(callback)) {
                return Q.resolve(callback(this)).then(helper.start.bind(helper));
            } else {
                return helper.start();
            }
        });
    },

    after: function () {
        after(function () {
            return helper.stop();
        });
    }
};


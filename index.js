// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var _ = require('lodash');

module.exports = function (di, directory) {
    var helper = require('./lib/common/di.js')(di, directory || __dirname);

    return {
        helper: helper,
        injectables: _.flatten(
            [
                helper.requireGlob(__dirname + '/lib/protocol/*.js'),
                helper.requireGlob(__dirname + '/lib/services/*.js'),
                helper.requireGlob(__dirname + '/lib/models/*.js'),
                helper.requireWrapper('q', 'Q'),
                helper.requireWrapper('nconf'),
                helper.requireWrapper('waterline', 'Waterline'),
                helper.requireWrapper('sails-mongo', 'MongoAdapter'),
                helper.simpleWrapper(_, '_'),
                require('./lib/common/constants'),
                require('./lib/common/logger'),
                require('./lib/common/model')
            ]
        )
    };
};
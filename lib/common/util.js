// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di'),
    util = require('util');

module.exports = UtilServiceFactory;

di.annotate(UtilServiceFactory, new di.Provide('Util'));

di.annotate(UtilServiceFactory,
    new di.Inject(
        '_'
    )
);

function UtilServiceFactory(_) {
    function UtilService () {
    }

    _.forEach(_.methods(util), function(method) {
        UtilService.prototype[method] = util[method];
    });

    UtilService.prototype.inheritsStatic = function inheritsStatic(cls, _super) {
        _.each(_.methods(_super), function(method) {
            cls[method] = _super[method].bind(cls);
        });
    };

    UtilService.prototype.inheritsAll = function inheritsAll(cls, _super) {
        this.inherits(cls, _super);
        this.inheritsStatic(cls, _super);
    };

    return new UtilService();
}

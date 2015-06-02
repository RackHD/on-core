// Copyright (c) 2015, EMC Corporation


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

    UtilService.prototype.provides = function (constructor) {
        if (_.isFunction(constructor)) {
            if (constructor.annotations && constructor.annotations.length) {
                var provides = _.detect(constructor.annotations, function (annotation) {
                    return _.has(annotation, 'token');
                });

                if (provides) {
                    return provides.token;
                }
            }
        }

        return undefined;
    };

    return new UtilService();
}

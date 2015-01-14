// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = baseProtocolObjectFactory;

di.annotate(baseProtocolObjectFactory, new di.Provide('Protocol.Objects.Base'));
di.annotate(baseProtocolObjectFactory,
    new di.Inject(
        'Errors',
        'validate',
        '_'
    )
);

function baseProtocolObjectFactory (Errors, validate, _) {
    function BaseProtocolObject (options) {
        _.defaults(this, options);
    }

    BaseProtocolObject.prototype.constraints = function () {
        throw new Error('Must override constraints method in inherited objects.');
    };

    BaseProtocolObject.prototype.validate = function () {
        var self = this,
            constraints = this.constraints();

        return validate.async(
            this, constraints
        ).then(function () {
            return self;
        }).catch(function (errors) {
            return new Errors.ValidationError(errors);
        });
    };

    return BaseProtocolObject;
}
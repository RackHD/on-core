// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = SkuModelFactory;

di.annotate(SkuModelFactory, new di.Provide('Models.Sku'));
di.annotate(SkuModelFactory, new di.Inject(
        'Model',
        '_',
        'Assert',
        'anchor'
    )
);

function SkuModelFactory (Model, _, assert, anchor) {
    var allRules = _.keys(anchor().rules);
    return Model.extend({
        types: {
            skuRules: function(rules) {
                _.forEach(rules, function (rule) {
                    assert.string(rule.path, 'rule.path');
                    _(_.omit(rule, 'path')).keys().forEach(function (key) {
                        assert.isIn(key, allRules, 'rule.' + key);
                    });
                });
                return true;
            },
        },
        connection: 'mongo',
        identity: 'skus',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            rules: {
                type: 'json',
                skuRules: true,
                required: true
            },
            nodes: {
                collection: 'nodes',
                via: 'sku'
            }
        }
    });
}


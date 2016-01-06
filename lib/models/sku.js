// Copyright 2015, EMC, Inc.

'use strict';

module.exports = SkuModelFactory;

SkuModelFactory.$provide = 'Models.Sku';
SkuModelFactory.$inject = [
    'Model',
    '_',
    'Assert',
    'Validatable',
    'anchor'
];

function SkuModelFactory (Model, _, assert, Validatable, Anchor) {
    var allRules = _.keys(new Anchor().rules);

    return Model.extend({
        types: {
            skuRules: function(rules) {
                assert.arrayOfObject(rules, 'rules');
                _.forEach(rules, function (rule) {
                    assert.string(rule.path, 'rule.path');
                    _(rule).omit('path').keys().forEach(function (key) {
                        assert.isIn(key, allRules, 'rule.' + key);
                    }).value();
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
            },
            discoveryGraphName: {
                type: 'string'
            },
            discoveryGraphOptions: {
                type: 'json'
            }
        }
    });
}

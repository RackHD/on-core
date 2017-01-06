// Copyright 2015, EMC, Inc.

'use strict';

module.exports = SkuModelFactory;

SkuModelFactory.$provide = 'Models.Sku';
SkuModelFactory.$inject = [
    'Model',
    '_',
    'Assert',
    'Validatable',
    'anchor',
    'Services.Configuration',
    'uuid'
];

function SkuModelFactory (Model, _, assert, Validatable, Anchor, configuration, uuid) {
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
        connection: configuration.get('databaseType', 'mongo'),
        identity: 'skus',
        attributes: {
            id: {
                type: 'string',
                uuidv4: true,
                primaryKey: true,
                unique: true,
                required: true,
                defaultsTo: function() { return uuid.v4(); }
            },
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
            },
            httpStaticRoot : {
                type: 'string'
            },
            httpTemplateRoot : {
                type: 'string'
            },
            httpProfileRoot : {
                type: 'string'
            },
            workflowRoot : {
                type: 'string'
            },
            taskRoot : {
                type: 'string'
            },
            skuConfig: {
                type: 'json'
            },
            version : {
                type: 'string'
            },
            description : {
                type: 'string'
            }
        },
        $indexes: [
            {
                keys: { name: 1 }
            }
        ]
    });
}

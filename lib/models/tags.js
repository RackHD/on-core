// Copyright 2016, EMC, Inc.

'use strict';

module.exports = TagModelFactory;

TagModelFactory.$provide = 'Models.Tag';
TagModelFactory.$inject = [
    'Model',
    '_',
    'Assert',
    'Validatable',
    'anchor'
];

function TagModelFactory (Model, _, assert, Validatable, Anchor) {
    var allRules = _.keys(new Anchor().rules);

    return Model.extend({
        types: {
            tagRules: function(rules) {
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
        identity: 'tags',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            rules: {
                type: 'json',
                tagRules: true,
                required: true
            }
        }
    });
}

// Copyright 2015, EMC, Inc.

'use strict';

module.exports = TemplateModelFactory;

TemplateModelFactory.$provide = 'Models.Template';
TemplateModelFactory.$inject = [
    'Model'
];

function TemplateModelFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'templates',
        attributes: {
            name: {
                type: 'string',
                required: true
            },
            contents: {
                type: 'string',
                required: true
            },
            scope: {
                type: 'string',
                defaultsTo: 'global'
            }
        }
    });
}

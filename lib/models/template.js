// Copyright (c) 2015, EMC Corporation

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
            }
        }
    });
}

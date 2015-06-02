// Copyright (c) 2015, EMC Corporation
/* jshint node: true */

'use strict';

var di = require('di');

module.exports = TemplateModelFactory;

di.annotate(TemplateModelFactory, new di.Provide('Models.Template'));
di.annotate(TemplateModelFactory, new di.Inject(
        'Model'
    )
);

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

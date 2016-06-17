// Copyright 2015, EMC, Inc.

'use strict';

module.exports = TemplateModelFactory;

TemplateModelFactory.$provide = 'Models.Template';
TemplateModelFactory.$inject = [
    'Model',
    'Renderable',
    '_',
    'Services.Configuration'
];

function TemplateModelFactory (Model, Renderable, _, configuration) {
    var templateModel = _.merge(
        {},
        Renderable,
        { identity: 'templates', connection: configuration.get('databaseType', 'mongo') }
    );
    return Model.extend(templateModel);
}

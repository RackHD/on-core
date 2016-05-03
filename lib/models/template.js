// Copyright 2015, EMC, Inc.

'use strict';

module.exports = TemplateModelFactory;

TemplateModelFactory.$provide = 'Models.Template';
TemplateModelFactory.$inject = [
    'Model',
    'Renderable',
    '_'
];

function TemplateModelFactory (Model, Renderable, _) {
    var templateModel = _.merge(
        {},
        Renderable,
        { identity: 'templates' }
    );
    return Model.extend(templateModel);
}

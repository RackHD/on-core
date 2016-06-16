// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ViewModelFactory;

ViewModelFactory.$provide = 'Models.View';
ViewModelFactory.$inject = [
    'Model',
    'Renderable',
    '_',
    'Services.Configuration'
];

function ViewModelFactory (Model, Renderable, _, configuration) {
    var viewModel = _.merge(
        {},
        Renderable,
        {identity: 'views', connection: configuration.get('databaseType', 'mongo') }
    );
    return Model.extend(viewModel);
}

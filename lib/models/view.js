// Copyright 2015, EMC, Inc.

'use strict';

module.exports = ViewModelFactory;

ViewModelFactory.$provide = 'Models.View';
ViewModelFactory.$inject = [
    'Model',
    'Renderable',
    '_'
];

function ViewModelFactory (Model, Renderable, _) {
    var viewModel = _.merge(
        {},
        Renderable,
        {identity: 'views'}
    );
    return Model.extend(viewModel);
}

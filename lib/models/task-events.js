// Copyright 2016, EMC, Inc.
'use strict';

module.exports = EventModelFactory;

EventModelFactory.$provide = 'Models.TaskEvents';
EventModelFactory.$inject = [
    'Model',
    'Services.Configuration'
];

function EventModelFactory(Model, configuration) {
    return Model.extend({
        connection: configuration.get('taskgraph-store', 'mongo'),
        identity: 'taskevents'
    });
}

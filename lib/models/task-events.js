'use strict';

module.exports = EventModelFactory;

EventModelFactory.$provide = 'Models.TaskEvents';
EventModelFactory.$inject = [
    'Model'
];

function EventModelFactory(Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'taskevents'
    });
}

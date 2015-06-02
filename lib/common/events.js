// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = eventsFactory;

eventsFactory.$provide = 'Events';
eventsFactory.$inject = [
    'EventEmitter'
];

function eventsFactory(EventEmitter) {
    return new EventEmitter();
}

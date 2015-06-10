// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = eventsFactory;

eventsFactory.$provide = 'Events';
eventsFactory.$inject = [
    'EventEmitter',
    'Constants',
    'Util'
];

function eventsFactory(EventEmitter, Constants, util) {
    function Events() {
        EventEmitter.call(this);
    }

    util.inherits(Events, EventEmitter);

    Events.prototype.ignoreError = function (error) {
        this.emit(Constants.Events.Ignored, error);
    };

    Events.prototype.log = function (data) {
        this.emit(Constants.Events.Log, data);
    };

    return new Events();
}


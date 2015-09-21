// Copyright 2015, EMC, Inc.

'use strict';

module.exports = messengerServiceFactory;

messengerServiceFactory.$provide = 'Services.Messenger';
messengerServiceFactory.$inject = [
    'Messenger'
];

function messengerServiceFactory(Messenger) {
    return new Messenger();
}

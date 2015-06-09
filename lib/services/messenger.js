// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = messengerServiceFactory;

messengerServiceFactory.$provide = 'Services.Messenger';
messengerServiceFactory.$inject = [
    'Messenger'
];

function messengerServiceFactory(Messenger) {
    return new Messenger();
}

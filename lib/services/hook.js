// Copyright 2017, Dell EMC, Inc.

'use strict';

module.exports = hookServiceFactory;

hookServiceFactory.$provide = 'Services.Hook';
hookServiceFactory.$inject = [
    'Hook'
];

function hookServiceFactory(
    Hook
) {
    return new Hook();
}

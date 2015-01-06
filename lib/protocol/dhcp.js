// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = dhcpProtocolFactory;

di.annotate(dhcpProtocolFactory, new di.Provide('Protocol.Dhcp'));
di.annotate(dhcpProtocolFactory,
    new di.Inject(
    )
);

function dhcpProtocolFactory () {
    return {};
}
// Copyright (c) 2015, EMC Corporation
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = tftpProtocolFactory;

di.annotate(tftpProtocolFactory, new di.Provide('Protocol.Tftp'));
di.annotate(tftpProtocolFactory,
    new di.Inject(
    )
);

function tftpProtocolFactory () {
    function TftpProtocol() {
    }

    return new TftpProtocol();
}

// Copyright 2015, EMC, Inc.

'use strict';

module.exports = tftpProtocolFactory;

tftpProtocolFactory.$provide = 'Protocol.Tftp';

function tftpProtocolFactory () {
    function TftpProtocol() {
    }

    return new TftpProtocol();
}

// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = tftpProtocolFactory;

tftpProtocolFactory.$provide = 'Protocol.Tftp';

function tftpProtocolFactory () {
    function TftpProtocol() {
    }

    return new TftpProtocol();
}

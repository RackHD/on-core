// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = httpProtocolFactory;

httpProtocolFactory.$provide = 'Protocol.Http';

function httpProtocolFactory () {
    function HttpProtocol() {
    }

    return new HttpProtocol();
}

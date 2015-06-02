// Copyright (c) 2015, EMC Corporation
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = httpProtocolFactory;

di.annotate(httpProtocolFactory, new di.Provide('Protocol.Http'));
di.annotate(httpProtocolFactory, new di.Inject());

function httpProtocolFactory () {
    function HttpProtocol() {
    }

    return new HttpProtocol();
}

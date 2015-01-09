// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = tftpProtocolFactory;

di.annotate(tftpProtocolFactory, new di.Provide('Protocol.Tftp'));
di.annotate(tftpProtocolFactory,
    new di.Inject(
        'Services.Messenger'
    )
);

function tftpProtocolFactory (messenger) {
    function TftpProtocol() {
        this.exchange = 'tftp';
    }

    TftpProtocol.prototype.start = function start() {
        return messenger.exchange(this.exchange, 'topic', {
            durable: true
        });
    };

    return new TftpProtocol();
}

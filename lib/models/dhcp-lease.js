// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = DhcpLeaseFactory;

DhcpLeaseFactory.$provide = 'Models.DhcpLease';
DhcpLeaseFactory.$inject = [
    'Model'
];

/*
 * Simple cache model for node lookups to be added to before a node model has
 * been created. Edited by various DHCP server instances (proxy, relay, full server)
 */
function DhcpLeaseFactory (Model) {
    return Model.extend({
        connection: 'mongo',
        identity: 'dhcpleases',
        attributes: {
            macAddress: {
                type: 'string',
                required: true,
                unique: true
            },
            ip: {
                type: 'string',
                required: true,
                unique: true
            }
        }
    });
}

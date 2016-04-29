// Copyright 2016, EMC, Inc.

'use strict';

module.exports = SystemUuidFactory;

SystemUuidFactory.$provide = 'SystemUuid';
SystemUuidFactory.$inject = [
    'uuid',
    'fs',
    'Logger',
    'Promise',
    'Assert'
];

function SystemUuidFactory(uuid, nodeFs, Logger, Promise, assert) {
    var logger = Logger.initialize(SystemUuidFactory);
    var fs = Promise.promisifyAll(nodeFs);
    
    function SystemUuid() {
    }
    
    SystemUuid.prototype.getUuid = function() {
        // Attempt to get the system's UUID from sysfs otherwise generate one
        return fs.readFileAsync('/sys/class/dmi/id/product_uuid')
        .then(function(content) {
            return content.toString().toLowerCase().replace(/(\r\n|\n|\r)/gm,'');
        })
        .then(function(uuid) {
            assert.uuid(uuid, 'System UUID');
            return uuid;
        })
        .catch(function(error) {
            logger.warning('Error getting system UUID, generating...', error);
            return uuid('v4');              
        });
    };

    return new SystemUuid();
}


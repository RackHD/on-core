// Copyright 2016, EMC, Inc.

'use strict';

module.exports = SystemUuidFactory;

SystemUuidFactory.$provide = 'SystemUuid';
SystemUuidFactory.$inject = [
    'uuid',
    'fs',
    'Logger',
    'Promise'
];

function SystemUuidFactory(uuid, nodeFs, Logger, Promise) {
    var logger = Logger.initialize(SystemUuidFactory);
    var fs = Promise.promisifyAll(nodeFs);
    
    function SystemUuid() {
    }
    
    SystemUuid.prototype.getUuid = function() {
        // Attempt to get the system's UUID from sysfs otherwise generate one
        return fs.readFileAsync('/sys/class/dmi/id/product_uuid')
        .then(function(content) {
            if(content) {
                return content.toString().toLowerCase().replace(/(\r\n|\n|\r)/gm,'');
            }
            logger.warning('Error getting system UUID, generating...');
            return uuid('v4');             
        })
        .then(function(uuid) {
            return uuid;
        });
    };

    return new SystemUuid();
}


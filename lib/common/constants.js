// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di');

module.exports = constantsFactory;

di.annotate(constantsFactory, new di.Provide('Constants'));
di.annotate(constantsFactory,
    new di.Inject(
    )
);

function constantsFactory () {
    var constants = Object.freeze({
        WorkingDirectory: process.cwd(),
        Logging: {
            Colors: {
              emerg: 'red',
              alert: 'yellow',
              crit: 'red',
              error: 'red',
              warning: 'red',
              notice: 'yellow',
              info: 'green',
              debug: 'blue',
              silly: 'blue'
            },
            Levels: {
                emerg: 8,
                alert: 7,
                crit: 6,
                error: 5,
                warning: 4,
                notice: 3,
                info: 2,
                debug: 1,
                silly: 0
            },
            Context: {
                Length: 6
            },
            Redactions: ['id', 'mac', 'ip']
        },
        Configuration: {
            Files: {
                Default: process.cwd() + '/config.json',
                Overrides: process.cwd() + '/overrides.json'
            }
        },
        WorkItems: {
            Pollers: {
                IPMI: 'Pollers.IPMI',
                SNMP: 'Pollers.SNMP'
            }
        },
        Protocol: {
            Exchanges: {
                Configuration: {
                    Name: 'configuration',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
                Dhcp: {
                    Name: 'dhcp',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
                Events: {
                    Name: 'events',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
                Http: {
                    Name: 'http',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
                Logging: {
                    Name: 'logging',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
                TaskGraphRunner: {
                    Name: 'task-graph-runner',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
                Scheduler: {
                    Name: 'scheduler',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
                Task: {
                    Name: 'task',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
                Tftp: {
                    Name: 'tftp',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
                Waterline: {
                    Name: 'waterline',
                    Options: {
                        type: 'topic',
                        durable: true
                    }
                },
            }
        },
        Profiles: {
            Directory: process.cwd() + '/data/profiles'
        },
        Templates: {
            Directory: process.cwd() + '/data/templates'
        }
    });

    return constants;
}

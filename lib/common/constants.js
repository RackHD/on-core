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
              silly: 'rainbow'
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
        Protocol: {
            Exchanges: {
                Configuration: {
                    Name: 'configuration',
                    Type: 'topic',
                    Options: {
                        durable: true
                    }
                },
                Dhcp: {
                    Name: 'dhcp',
                    Type: 'topic',
                    Options: {
                        durable: true
                    }
                },
                Events: {
                    Name: 'events',
                    Type: 'topic',
                    Options: {
                        durable: true
                    }
                },
                Http: {
                    Name: 'http',
                    Type: 'topic',
                    Options: {
                        durable: true
                    }
                },
                Logging: {
                    Name: 'logging',
                    Type: 'topic',
                    Options: {
                        durable: true
                    }
                },
                TaskGraphRunner: {
                    Name: 'task-graph-runner',
                    Type: 'topic',
                    Options: {
                        durable: true
                    }
                },
                Scheduler: {
                    Name: 'scheduler',
                    Type: 'topic',
                    Options: {
                        durable: true
                    }
                },
                Task: {
                    Name: 'task',
                    Type: 'topic',
                    Options: {
                        durable: true
                    }
                },
                Tftp: {
                    Name: 'tftp',
                    Type: 'topic',
                    Options: {
                        durable: true
                    }
                },
                Waterline: {
                    Name: 'waterline',
                    Type: 'topic',
                    Options: {
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

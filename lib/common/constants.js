// Copyright (c) 2015, EMC Corporation

'use strict';

module.exports = constantsFactory;

constantsFactory.$provide = 'Constants';

function constantsFactory () {
    var constants = Object.freeze({
        WorkingDirectory: process.cwd(),
        Events: {
            Log: 'log',
            Unhandled: 'errors.unhandled',
            Ignored: 'errors.ignored',
            Blocked: 'errors.blocked'
        },
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
            Sanitizations: ['id', 'mac', 'ip'],
            Redactions: [ 'password' ]
        },
        Configuration: {
            Files: {
                Global: '/etc/monorail.json',
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
                    Name: 'on.configuration',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Dhcp: {
                    Name: 'on.dhcp',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Events: {
                    Name: 'on.events',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Http: {
                    Name: 'on.http',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Logging: {
                    Name: 'on.logging',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                TaskGraphRunner: {
                    Name: 'on.task-graph-runner',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Scheduler: {
                    Name: 'on.scheduler',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Task: {
                    Name: 'on.task',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Tftp: {
                    Name: 'on.tftp',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Waterline: {
                    Name: 'on.waterline',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Test: {
                    Name: 'on.test',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                }
            }
        },
        Profiles: {
            Directory: process.cwd() + '/data/profiles'
        },
        Templates: {
            Directory: process.cwd() + '/data/templates'
        },
        TaskStates: {
            Running: 'running',
            Succeeded: 'succeeded',
            Failed: 'failed',
            Cancelled: 'cancelled',
            Timeout: 'timeout',
            Pending: 'pending'
        },
        Regex: {
            Base64: /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i,
            Encrypted: /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})\.(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i, // jshint ignore:line
            MacAddress: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
            IpAddress: /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/,
        }
    });

    return constants;
}


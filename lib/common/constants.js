// Copyright © 2015-2017 Dell Inc. or its subsidiaries.  All Rights Reserved.

'use strict';

module.exports = constantsFactory;

constantsFactory.$provide = 'Constants';
constantsFactory.$inject = [
    'path'
];

function constantsFactory (path) {
    var constants = Object.freeze({
        WorkingDirectory: process.cwd(),
        Name: process.cwd().split(path.sep).reverse()[0],
        Host: require('os').hostname().split(/\./)[0],
        Events: {
            Log: 'log',
            Unhandled: 'errors.unhandled',
            Ignored: 'errors.ignored',
            Blocked: 'errors.blocked'
        },
        Logging: {
            Colors: {
              critical: 'red',
              error: 'red',
              warning: 'yellow',
              info: 'green',
              debug: 'cyan',
            },
            Levels: {
                critical: 5,
                error: 4,
                warning: 3,
                info: 2,
                debug: 1
            },
            Context: {
                Length: 6
            },
            Sanitizations: ['id', 'mac', 'ip'],
            Redactions: [ /password/i, /^community$/i ]
        },
        Configuration: {
            Files: {
                Global: process.env.MONORAIL_CONFIG || '/opt/monorail/config.json',
                Dell: '/opt/monorail/smiConfig.json'
            }
        },
        WorkItems: {
            Pollers: {
                IPMI: 'Pollers.IPMI',
                SNMP: 'Pollers.SNMP',
                REDFISH: 'Pollers.Redfish',
				WSMAN: 'Pollers.WSMAN',
                UCS: 'Pollers.UCS',
                Metrics: {
                    SnmpInterfaceBandwidthUtilization: 'snmp-interface-bandwidth-utilization',
                    SnmpInterfaceState: 'snmp-interface-state',
                    SnmpProcessorLoad: 'snmp-processor-load',
                    SnmpMemoryUsage: 'snmp-memory-usage',
                    SnmpPduPowerStatus: 'snmp-pdu-power-status',
                    SnmpPduSensorStatus: 'snmp-pdu-sensor-status',
                    SnmpTxRxCounters: 'snmp-txrx-counters',
                    SnmpSwitchSensorStatus: 'snmp-switch-sensor-status'
                }
            },
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
                },
                SSDP: {
                    Name: 'on.ssdp',
                    Options: {
                        type: 'topic',
                        durable: true,
                        autoDelete: false
                    }
                },
                Heartbeat: {
                    Name: 'on.heartbeat',
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
        Views: {
             Directory: process.cwd() + '/data/views'
        },
        Task: {
            FinishedStates: [
                'succeeded',
                'timeout',
                'cancelled',
                'failed'
            ],
            FailedStates: [
                'failed',
                'timeout',
                'cancelled'
            ],
            ActiveStates: [
                'pending',
                'running'
            ],
            States: {
                Running: 'running',
                Succeeded: 'succeeded',
                Failed: 'failed',
                Cancelled: 'cancelled',
                Timeout: 'timeout',
                Pending: 'pending',
                Finished: 'finished'
            },
            DefaultDomain: 'default',
            DefaultLeaseAdjust: 20000,
        },
        Regex: {
            Base64: /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i,
            Encrypted: /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})\.(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i, // jshint ignore:line
            MacAddress: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
            IpAddress: /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/,
            uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        },
        ChildProcess: {
            maxBuffer: 200 * 1024
        },
        ObmSettings: {
            'noop-obm-service': [
                {
                    type: 'compute'
                },
            ],
            'ipmi-obm-service': [
                {
                    type: 'compute'
                }
            ],
            'panduit-obm-service': [
                {
                    type: 'enclosure'
                },
                {
                    type: 'compute',
                    sku: 'noop' // Example for multi-item rule
                }
            ],
            'vbox-obm-service': [
                {
                    type: 'compute'
                }
            ],
            'redfish-obm-service': [
                {
                    type: 'compute'
                },
                {
                    type: 'enclosure'
                }
            ]
        },
        NodeRelations: {
            /* There are two classes about the pair of relations:
             * component: one node is a component of the other
             *     e.g.  compute node vs. enclosure node
             *     expect behavior:
             *         the "By" in the relationType is used to tell component from its parent
             *         delete a node as well as its components;
             *         delete a component and update its parenet node
             * link: two nodes is linked to each other
             *     e.g.  compute node vs pdu node (TODO)
             *     expect behavior:
             *         delete one node and update the other
            */
            encloses: {
                mapping: 'enclosedBy',
                relationClass: 'component'
            },
            enclosedBy: {
                mapping: 'encloses',
                relationClass: 'component'
            },
            /* Below are an example used to verify function
             * currently used in unit test
             compute node:
             "relations": [
                 {
                     "relationType": "poweredBy",
                     "targets": [
                         "567b8f478b7444e407bb0729"
                     ]
                 }
             ],
             pdu node:
             "relations": [
                 {
                     "relationType": "powers",
                     "targets": [
                         "567b8f478b7444e407bb072a"
                         "567b8f478b7444e407bb072b"
                     ]
                 }
             ],
             If either of them is removed, the other node will only be updated without deletion
            */
            powers: {
                mapping: 'poweredBy',
                relationClass: 'link'
            },
            poweredBy: {
                mapping: 'powers',
                relationClass: 'link'
            },
            /* end example */
            contains: {
                mapping: 'containedBy',
                relationClass: 'link'
            },
            containedBy: {
                mapping: 'contains',
                relationClass: 'link'
            }
        },
        Scope: {
            Global: 'global'
        },
        NodeTypes: {
            ComputerContainer: 'compute-container',
            Compute: 'compute',
            Switch: 'switch',
            Dae: 'dae',
            Pdu: 'pdu',
            Mgmt: 'mgmt',
            Enclosure: 'enclosure',
            Rack: 'rack',
            Storage: 'storage',
            Iom: 'iom',
            Cooling: 'cooling',
            Power: 'power'
        },
        Redfish: {
            EventTypes: {
                StatusChange: 'StatusChange',
                ResourceUpdated: 'ResourceUpdated',
                ResourceAdded: 'ResourceAdded',
                ResourceRemoved: 'ResourceRemoved',
                Alert: 'Alert'
            }
        },
        HttpHeaders: {
            ApiProxyIp: 'X-RackHD-API-proxy-ip',
            ApiProxyPort: 'X-RackHD-API-proxy-port'
        },
        Heartbeat: {
            defaultIntervalSec: 10
        },
        HttpStaticDir: {
            systemDefault: 'static/http',
            userDefault: '/opt/monorail/static/http',
            skupack: 'skupack.d',
            upnp: 'static/upnp'
        },
        Progress: {
            DefaultTaskProgressMaximum: 100
        }
    });

    return constants;
}

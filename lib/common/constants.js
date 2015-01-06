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
        NCONF_CONFIG_PATH: '/etc/renasar/config.json',

        TASK_REBOOT_CODE_SHELL: 1,
        TASK_REBOOT_CODE_IPMI: 2,
        TASK_REBOOT_CODE_DEBUG: 127,

        MAX_TASK_PAYLOAD_SIZE: "10mb",

        VALID_OBM_SERVICES: ['ipmi-obm-service', 'hms-obm-service', 'noop-obm-service',
                             'vbox-obm-service', 'amt-obm-service', 'raritan-obm-service',
                             'vmrun-obm-service', 'apc-obm-service', 'servertech-obm-service'],

        VALID_FILE_SOURCES: ['megaraid-config'],

        /**
         * EAPI poller channels
         */
        EAPI_MACHINE_REGISTRY_CHANNEL: 'eapi.machine.registry',
        EAPI_MACHINE_UPDATE_TOPIC: 'eapi.machine.update',
        EAPI_MACHINE_DELETE_TOPIC: 'eapi.machine.delete',

        EAPI_MACHINE_DATA_CHANNEL: 'eapi.machine.data',
        EAPI_MACHINE_DATA_TOPIC: 'eapi.machine.sample',

        /**
         * IPMI poller channels
         */
        IPMI_MACHINE_REGISTRY_CHANNEL: 'ipmi.machine.registry',
        IPMI_MACHINE_UPDATE_TOPIC: 'ipmi.machine.update',
        IPMI_MACHINE_DELETE_TOPIC: 'ipmi.machine.delete',

        SELLIST_MACHINE_DATA_CHANNEL: 'ipmi.sel.data',
        SELLIST_MACHINE_FULLSTATE_TOPIC: 'ipmi.sel.full',
        SELLIST_MACHINE_CHANGES_TOPIC: 'ipmi.sel.changes',

        /**
         * SNMP poller channels
         */
        SNMP_MACHINE_REGISTRY_CHANNEL: 'snmphost',
        SNMP_MACHINE_UPDATE_TOPIC: 'snmphostupdate',
        SNMP_MACHINE_DELETE_TOPIC: 'snmphostdelete',

        SNMP_MACHINE_DATA_CHANNEL: 'snmp.machine.data',
        SNMP_MACHINE_DATA_TOPIC:   'snmp.machine.sample',

        /**
         * SDR poller channels
         */
        SDR_MACHINE_DATA_CHANNEL: 'sdr.machine.data',
        SDR_MACHINE_DATA_TOPIC:   'sdr.machine.sample',

        /**
         * Syslog data flow channels
         */
        SYSLOG_EVENT_CHANNEL: 'syslog',
        SYSLOG_EVENT_TOPIC: 'syslog.events',

        /**
         * Workflow Channels
         */
        WORKFLOW_CHANNEL_WORKFLOW_EVENTS: 'workflows',
        WORKFLOW_CHANNEL_IMAGING_EVENTS: 'imaging.events',

        /**
         * Workflow Events
         */
        WORKFLOW_EVENT_WILDCARD: 'workflow.*',
        WORKFLOW_EVENT_STARTED: 'workflow.started',
        WORKFLOW_EVENT_COMPLETED: 'workflow.completed',
        WORKFLOW_EVENT_FAILED: 'workflow.failed',
        WORKFLOW_EVENT_TRANSITION: 'workflow.transition',
        WORKFLOW_EVENT_UPDATED: 'workflow.updated',

        WORKFLOW_EVENT_CATALOG: 'workflows.catalog',

        WORKFLOW_EVENT_TASKS_REQUEST: 'tasks.request',
        WORKFLOW_EVENT_TASKS_RESPONSE: 'tasks.response',

        WORKFLOW_EVENT_PROPERTIES_REQUEST: 'properties.request',

        WORKFLOW_EVENT_EXTERNAL_ERROR: 'external.error',

        WORKFLOW_EVENT_HTTP_WILDCARD: 'http.*',
        WORKFLOW_EVENT_HTTP_RESPONSE: 'http.response',

        WORKFLOW_EVENT_TFTP_WILDCARD: 'tftp.*',
        WORKFLOW_EVENT_TFTP_ERROR: 'tftp.error',
        WORKFLOW_EVENT_TFTP_ABORT: 'tftp.abort',
        WORKFLOW_EVENT_TFTP_FINISH: 'tftp.finish',

        WORKFLOW_EVENT_DHCP_WILDCARD: 'dhcp.*',

        WORKFLOW_EVENT_REPORT: 'catalogs.report',

        /**
         * Workflow progress topic
         */
        WORKFLOW_PROGRESS_TOPIC: 'progress',

        /**
         * Workflow States
         */
        WORKFLOW_STATE_INITIAL: 'starting',
        WORKFLOW_STATE_RUNNING: 'running',
        WORKFLOW_STATE_FAILED: 'failed',
        WORKFLOW_STATE_COMPLETED: 'completed',
        WORKFLOW_STATE_UNINITIALIZED: 'uninitialized',

        PARENT_WORKFLOW_TYPE: 'parentWorkflow',
        CHILD_WORKFLOW_TYPE: 'childWorkflow',

        // Default maximum number of workflows we will keep in memory at one time.
        // The rest get deleted from the LRU cache.
        DEFAULT_MAX_WORKFLOWS: 100,

        RENASAR_IPMI_USER: 'renasar',
        RENASAR_IPMI_LAN_PASS: 'renasarrenasa',
        RENASAR_IPMI_LANPLUS_PASS: 'renasarrenasarren',

        // Logger Constants
        LOGGER_CHANNEL: 'logging',
        LOGGER_EVENT_WILDCARD: 'logging.*',
        LOGGER_EVENT_META_ID: '_id',
        LOGGER_EVENT_META_IDENTIFIER: 'identifier',
        LOGGER_EVENT_META_IP: 'ip',
        LOGGER_EVENT_META_MACADDRESS: 'macaddress',

        DISKBOOT_PROFILE: 'diskboot.ipxe',

        // Workflow name to designate to the vmware remediation workflow
        // created at runtime
        VMWARE_REMEDIATE_WORKFLOW: 'VMWare-Remediate'
    });

    return constants;
}
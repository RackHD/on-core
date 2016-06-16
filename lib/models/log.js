// Copyright 2015, EMC, Inc.

'use strict';

module.exports = LogModelFactory;

LogModelFactory.$provide = 'Models.Log';
LogModelFactory.$inject = [
    'Model',
    'Constants',
    '_',
    'Services.Configuration'
];

function LogModelFactory (Model, constants, _, configuration) {
    return Model.extend({
        connection: configuration.get('databaseType', 'mongo'),
        identity: 'logs',
        autoPK: true,
        attributes: {
            module: {
                type: 'string',
                required: false
            },
            level: {
                type: 'string',
                required: true,
                in: _.keys(constants.Logging.Levels)
            },
            message: {
                type: 'string',
                required: true
            },
            context: {
                type: 'json',
                required: false,
                json: true
            },
            trace: {
                type: 'string',
                uuidv4: true,
                required: true
            },
            timestamp: {
                type: 'datetime',
                required: true
            },
            caller: {
                type: 'string',
                required: true
            },
            subject: {
                type: 'string',
                required: true
            },
            host: {
                type: 'string',
                required: true
            }
        },
        beforeCreate: function(values, cb) {
            if (values.context && values.context.data) {
                values.context.data = updateKeys(values.context.data, _);
            }
            cb();
        }
    });
}

/*
 * Change all key values containing '.' to '_', since the driver won't allow
 * keys with dots by default
 */
function updateKeys(obj, _) {
    var newObj = null;
    if (_.isArray(obj)) {
        newObj = [];
    } else if (_.isObject(obj)) {
        newObj = {};
    } else {
        return obj;
    }
    _.forEach(obj, function(value, key) {
        if (key.replace) {
            var newKey = key.replace(/\$|\./g, '_');
            newObj[newKey] = updateKeys(value, _);
        } else {
            newObj[key] = updateKeys(value, _);
        }
    });
    return newObj;
}

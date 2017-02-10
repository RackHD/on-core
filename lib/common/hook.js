// Copyright 2017, Dell EMC, Inc.

'use strict';

module.exports = hookFactory;

hookFactory.$provide = 'Hook';
hookFactory.$inject = [
    '_',
    'Assert',
    'Services.Waterline',
    'HttpTool',
    'Promise'
];

function hookFactory(
    _,
    assert,
    waterline,
    HttpTool,
    Promise
) {
    function Hook(){
    }

    /**
     * Post data to RackHD-stored web hook list
     *
     * @param {Object} data
     * @returns {Promise}
     */
    Hook.prototype.publish = function(data) {
        var self = this;
        return Promise.try(function(){
            return waterline.hooks.find({});
        })
        .map(function(hook){
            return self._publish(hook, data);
        });
    };

    /**
     * Post data to provided web hook
     *
     * @param {Array} hookList
     * @param {Object} data
     * @returns {Promise}
     */
    Hook.prototype._publish = function(hook, data) {
        //Current filtering mechanism only filters against common event header
        //Payload data filtering in event messages is not supported
        var isQualified = _filter(data, hook.filters);
        if(!isQualified){
            return;
        }

        var httpSettings = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            data: data,
            url: hook.url
        };
        var httpTool = new HttpTool();
        return httpTool.setupRequest(httpSettings)
        .then(function(){
            return httpTool.runRequest();
        });
    };

    function _filter(data, filters) {
        if (_.isEmpty(filters)) {
            return true;
        }
        var isQualified = false;
        _.forEach(filters, function(filter){
            isQualified = _conditionFilter(data, filter);
            return !isQualified;
        });
        return isQualified;
    }

    function _conditionFilter(data, filter) {
        var isPassed = true;
        _.forEach(filter, function(value, key){
            //TODO: if in the future we implemented caching for hooks, RE should be compiled
            // in advance instead of inside forEach loop.
            var pattern = new RegExp(value);
            isPassed = _.has(data, key) && pattern.test(data[key]);
            return isPassed;
        });
        return  isPassed;
    }

    Hook.prototype.start = function start() {
        return Promise.resolve();
    };

    Hook.prototype.stop = function stop() {
        return Promise.resolve();
    };
    return Hook;
}

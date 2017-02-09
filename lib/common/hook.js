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
        if(!_isQualifiedData(data, hook.filters)){
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

    function _isQualifiedData(data, filters) {
        //TODO: design filters for hook here.
        return true;
    }

    Hook.prototype.start = function start() {
        return Promise.resolve();
    };

    Hook.prototype.stop = function stop() {
        return Promise.resolve();
    };
    return Hook;
}

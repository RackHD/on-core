// Copyright 2015, EMC, Inc.

'use strict';

var http =  require('http');
var https =  require('https');
var url = require('url');

module.exports = hookServiceFactory;

hookServiceFactory.$provide = 'Services.Hook';
hookServiceFactory.$inject = [
    'Services.Messenger',
    '_',
    'Assert',
    'Services.Waterline'
];

function hookServiceFactory(
    messenger,
    _,
    assert,
    waterline
) {
    function HookService(){
    }
    
    /**
     * Publishes the JSON serialized from 'data' into AMQP based on exchange and routingKey.
     *
     * @param {string} name
     * @param {string} routingKey
     * @param {Object} data
     * @param {Object} options
     * @returns {Promise}
     */
    HookService.prototype.publish = function(name, routingKey, data, options) {
        assert.string(name, 'name');
        assert.string(routingKey, 'routingKey');
        assert.object(data, 'data');
        return messenger.publish(name, routingKey, data, options)
        .tap(function(){
            return waterline.hooks.find({})
            .then(function(hookList){
                data.routingKey = routingKey;
                postDataToUrls(hookList, data);
            });
        });
    };

    function postDataToUrls(hookList, data) {
        if(_.isEmpty(hookList)) {
            return;
        }
        _.forEach(hookList, function(hook){
            if(_validateUrlRule(data)){
                _postDataToUrl(hook, data);
            }
        });
    }

    function _validateUrlRule(data) {
        //TODO: design rules here.
        return true;
    }

    function _postDataToUrl(hook, data){
        assert.object(hook);
        assert.object(data);
        assert.string(hook.url);
        
        var hookObj = url.parse(hook.url);
        var options = {
            hostname: hookObj.hostname,
            port: hookObj.port,
            path: hookObj.path,
            method: 'POST',
            headers: {'Content-Type': hook.contentType || 'application/json'}
        };
        var req;
        if ( hookObj.protocol === "https:") {
            req = https.request(options, function(res){
                res.setEncoding('utf8');
            });
        } else {
            req = http.request(options, function(res){
                res.setEncoding('utf8');
            });
        }
        req.write(JSON.stringify(data));
        req.end();
    }

    HookService.prototype.start = function start() {
        this.started = true;
        return Promise.resolve();
    };

    HookService.prototype.stop = function stop() {
        return Promise.resolve();
    };

    return new HookService();
}

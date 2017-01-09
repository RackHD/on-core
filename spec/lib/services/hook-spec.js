// Copyright 2015, EMC, Inc.

'use strict';

var nock = require('nock');
var http = require('http');
var https = require('https');

describe('Hook', function () {
    var payload, httpSpy, httpsSpy, hookService, messengerService, waterline;
    var hooks = [
        {url: 'http://172.1.1.1:8080/test', id: 'id1'},
        {url: 'https://172.1.1.0:8080/test', id: 'id2'}
    ];
    var self = this;
    self.sandbox = sinon.sandbox.create();
    before("Before user url test", function(){
        helper.setupInjector([
            helper.require('/lib/services/hook'),
            helper.require('/lib/services/messenger'),
            helper.require('/lib/services/waterline')
        ]);
        hookService = helper.injector.get('Services.Hook');
        messengerService = helper.injector.get('Services.Messenger');
        waterline = helper.injector.get('Services.Waterline');
        waterline.hooks = {
            find: function() {}
        };
        payload = JSON.stringify({hello: 'world', routingKey: 'test'});
    });
    
    beforeEach("Before each user url test", function(){
        httpSpy  = self.sandbox.spy(http, 'request');
        httpsSpy  = self.sandbox.spy(https, 'request');
        self.sandbox.stub(messengerService, 'publish').resolves();
    });

    afterEach("After each user url test", function(){
        self.sandbox.restore();
    });

    it('should post data to user urls with http service', function () {
        var scope = nock('http://172.1.1.1:8080')
                    .filteringRequestBody(function(body){
                        if (!_.isEqual(payload, body)) {
                            throw new Error('body is not matched');
                        }
                    })
                    .post('/test')
                    .reply(201, 'OK');
        self.sandbox.stub(waterline.hooks, 'find').resolves([hooks[0]]);
        return hookService.publish(
            'name',
            'test',
            { hello: 'world' },
            {postDataToUrl: true}
        ).then(function(){
            expect(http.request).to.have.been.calledOnce;
            expect(https.request).to.have.not.been.called;
            nock.removeInterceptor(scope);
        });
    });

    it('should post data to user url with https service', function () {
        var scope = nock('https://172.1.1.0:8080')
                    .filteringRequestBody(function(body){
                        if (!_.isEqual(payload, body)) {
                            throw new Error('body is not mathed');
                        }
                    })
                    .post('/test')
                    .reply(201, 'OK');
        self.sandbox.stub(waterline.hooks, 'find').resolves([hooks[1]]);
        return hookService.publish(
            'name',
            'test',
            { hello: 'world' },
            {postDataToUrl: true}
        ).then(function(){
            expect(https.request).to.have.been.calledOnce;
            expect(http.request).to.have.not.been.called;
            expect(waterline.hooks.find).to.have.been.calledOnce;
            expect(waterline.hooks.find).to.have.been.calledWith({});
            nock.removeInterceptor(scope);
        });
    });

    it('should post data to user urls', function () {
        var scopeHttps = nock('https://172.1.1.0:8080')
                    .filteringRequestBody(function(body){
                        if (!_.isEqual(payload, body)) {
                            throw new Error('body is not mathed');
                        }
                    })
                    .post('/test')
                    .reply(201, 'OK');
        var scopeHttp = nock('http://172.1.1.1:8080')
                    .filteringRequestBody(function(body){
                        if (!_.isEqual(payload, body)) {
                            throw new Error('body is not matched');
                        }
                    })
                    .post('/test')
                    .reply(201, 'OK');
        self.sandbox.stub(waterline.hooks, 'find').resolves(hooks);
        return hookService.publish(
            'name',
            'test',
            { hello: 'world' },
            {postDataToUrl: true}
        ).then(function(){
            expect(https.request).to.have.been.calledOnce;
            expect(http.request).to.have.been.called;
            nock.removeInterceptor(scopeHttps);
            nock.removeInterceptor(scopeHttp);
        });
    });

    it('should not post data to user url if no hook exists', function () {
        self.sandbox.stub(waterline.hooks, 'find').resolves([]);
        return hookService.publish(
            'name',
            'test',
            { hello: 'world' }
        ).then(function(){
            expect(http.request).to.have.not.been.called;
            expect(https.request).to.have.not.been.called;
        });
    });

});

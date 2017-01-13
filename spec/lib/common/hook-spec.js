// Copyright 2017, Dell EMC, Inc.

'use strict';

var nock = require('nock');

describe('Hook', function () {
    var hook, waterline, findStub, _publishSpy;
    var hooks = [
        {url: 'http://172.1.1.1:8080/test', id: 'id1'},
        {url: 'https://172.1.1.0:8080/test', id: 'id2'}
    ];
    var payload = {"hello": "world", "routingKey": "test"};
    
    before("Before hook test", function(){
        helper.setupInjector([
            helper.require('/lib/common/hook'),
            helper.require('/lib/common/http-tool'),
            helper.require('/lib/services/waterline')
        ]);
        hook = helper.injector.get('Hook');
        waterline = helper.injector.get('Services.Waterline');
        waterline.hooks = {
            find: function() {}
        };
        findStub = sinon.stub(waterline.hooks, 'find');
        _publishSpy = sinon.spy(hook, '_publish');
    });

    afterEach("After hook test", function(){
        _publishSpy.reset();
        findStub.reset();
    });

    it('should post data to hook url with http service', function () {
        var scope = nock('http://172.1.1.1:8080')
                    .filteringRequestBody(function(body){
                        if (!_.isEqual(payload, JSON.parse(body))) {
                            throw new Error('body is not matched');
                        }
                    })
                    .post('/test')
                    .reply(201, 'OK');
        findStub.withArgs({}).resolves([hooks[0]]);
        return hook.publish(payload)
        .then(function(){
            expect(hook._publish).to.have.been.calledOnce;
            expect(hook._publish).to.have.been.calledWith(hooks[0], payload);
            expect(waterline.hooks.find).to.have.been.calledOnce;
            nock.removeInterceptor(scope);
        });
    });

    it('should post data to hook urls', function () {
        var scopeHttps = nock('https://172.1.1.0:8080')
                    .filteringRequestBody(function(body){
                        if (!_.isEqual(payload, JSON.parse(body))) {
                            throw new Error('body is not matched');
                        }
                    })
                    .post('/test')
                    .reply(201, 'OK');
        var scopeHttp = nock('http://172.1.1.1:8080')
                    .filteringRequestBody(function(body){
                        if (!_.isEqual(payload, JSON.parse(body))) {
                            throw new Error('body is not matched');
                        }
                    })
                    .post('/test')
                    .reply(201, 'OK');
        findStub.withArgs({}).resolves(hooks);
        return hook.publish(payload)
        .then(function(){
            expect(hook._publish).to.have.been.calledTwice;
            expect(hook._publish).to.have.been.calledWith(hooks[0], payload);
            expect(hook._publish).to.have.been.calledWith(hooks[1], payload);
            expect(waterline.hooks.find).to.have.been.calledOnce;
            nock.removeInterceptor(scopeHttps);
            nock.removeInterceptor(scopeHttp);
        });
    });

    it('should not post data to hook url if no hook exists', function () {
        findStub.withArgs({}).resolves([]);
        return hook.publish(payload)
        .then(function(){
            expect(hook._publish).to.have.not.been.called;
        });
    });

});

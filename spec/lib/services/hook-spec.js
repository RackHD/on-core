// Copyright 2017, Dell EMC, Inc.

'use strict';

var nock = require('nock');

describe('Hook', function () {
    var hookService , waterline, findStub, _publishSpy;
    var hooks = [
        {url: 'http://172.1.1.1:8080/test', id: 'id1'},
        {url: 'https://172.1.1.0:8080/test', id: 'id2'}
    ];
    var payload = {"hello": "world", "routingKey": "test"};
    
    helper.before();
    
    before("Before hookService  test", function(){
        helper.setupInjector([
            helper.require('/lib/services/hook'),
            helper.require('/lib/common/http-tool'),
            helper.require('/lib/services/waterline')
        ]);
        hookService = helper.injector.get('Services.Hook');
        waterline = helper.injector.get('Services.Waterline');
        waterline.hooks = {
            find: function() {}
        };
        findStub = sinon.stub(waterline.hooks, 'find');
        _publishSpy = sinon.spy(hookService , '_publish');
    });

    helper.after();

    afterEach("After hookService  test", function(){
        _publishSpy.reset();
        findStub.reset();
        nock.cleanAll();
    });

    it('should have start and stop methods', function(){
        expect(hookService .start).to.be.a.method;
        expect(hookService .stop).to.be.a.method;
    });

    it('should post data to hook url with http service', function (done) {
        nock('http://172.1.1.1:8080')
            .filteringRequestBody(function(body){
                if (!_.isEqual(payload, JSON.parse(body))) {
                    done(new Error('body is not matched'));
                }
            })
            .post('/test')
            .reply(201, 'OK');
        findStub.withArgs({}).resolves([hooks[0]]);
        return hookService .publish(payload)
        .then(function(){
            expect(hookService ._publish).to.have.been.calledOnce;
            expect(hookService ._publish).to.have.been.calledWith(hooks[0], payload);
            expect(waterline.hooks.find).to.have.been.calledOnce;
            done();
        });
    });

    it('should post data to hook urls', function (done) {
        nock('https://172.1.1.0:8080')
            .filteringRequestBody(function(body){
                if (!_.isEqual(payload, JSON.parse(body))) {
                    done(new Error('body is not matched'));
                }
            })
            .post('/test')
            .reply(201, 'OK');
        nock('http://172.1.1.1:8080')
            .filteringRequestBody(function(body){
                if (!_.isEqual(payload, JSON.parse(body))) {
                    done(new Error('body is not matched'));
                }
            })
            .post('/test')
            .reply(201, 'OK');

        findStub.withArgs({}).resolves(hooks);
        return hookService .publish(payload)
        .then(function(){
            expect(hookService ._publish).to.have.been.calledTwice;
            expect(hookService ._publish).to.have.been.calledWith(hooks[0], payload);
            expect(hookService ._publish).to.have.been.calledWith(hooks[1], payload);
            expect(waterline.hooks.find).to.have.been.calledOnce;
            done();
        });
    });

    it('should not post data to hook url if no hook exists', function () {
        findStub.withArgs({}).resolves([]);
        return hookService .publish(payload)
        .then(function(){
            expect(hookService ._publish).to.have.not.been.called;
        });
    });

    it('should post data to hook urls independently', function (done) {
        nock('https://172.1.1.0:8080')
            .filteringRequestBody(function(body){
                if (!_.isEqual(payload, JSON.parse(body))) {
                    done(new Error('body is not matched'));
                }
            })
            .post('/test')
            .reply(201, 'OK');
        findStub.withArgs({}).resolves(hooks);
        _publishSpy.restore();
        sinon.stub(hookService , '_publish').withArgs(hooks[0], payload)
            .rejects(new Error('Failed to send data to all hooks'));
        return hookService .publish(payload)
        .then(function(){
            done(new Error('Test should fail'));
        })
        .catch(function(err){
            expect(hookService ._publish).to.have.been.calledTwice;
            expect(hookService ._publish).to.have.been.calledWith(hooks[0], payload);
            expect(hookService ._publish).to.have.been.calledWith(hooks[1], payload);
            expect(err.message).equals('Failed to send data to all hooks');
            expect(waterline.hooks.find).to.have.been.calledOnce;
            done();
        });
    });

});

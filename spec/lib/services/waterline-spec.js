// Copyright 2015, EMC, Inc.

'use strict';

describe('Services.Waterline', function () {
    var waterline,
        sandbox = sinon.sandbox.create();

    helper.before(function(context) {
        context.Core = {
            start: sandbox.stub().resolves(),
            stop: sandbox.stub().resolves()
        };
        return helper.di.simpleWrapper(context.Core, 'Services.Core' );
    });

    before(function() {
       waterline = helper.injector.get('Services.Waterline');
    });

    helper.after();
    after(function() {
        sandbox.restore();
    });

    describe('start', function () {
        it('should start service and resolve', function() {
            var createIndexesStub = this.sandbox.stub().resolves();
            waterline.service.initialize = this.sandbox.spy(function(cfg,callback) {
                var ontology = {
                    collections:{
                        'testModel': {
                            identity: 'test',
                            createIndexes: createIndexesStub
                        }
                    }
                };
                callback(undefined, ontology);
            });
            return waterline.start().then(function() {
                expect(createIndexesStub).to.have.been.called;
            });
        });

        it('should resolve itself if already initialized', function() {
            this.sandbox.stub(waterline, 'isInitialized').returns(true);
            return waterline.start().should.be.resolved;
        });

        it('should reject if an error occurs when it is not initialized', function() {
            this.sandbox.stub(waterline, 'isInitialized').returns(false);
            waterline.service.initialize = this.sandbox.spy(function(cfg,callback) {
                callback(Error);
            });
            return waterline.start().should.be.rejected;
        });
    });

    describe('stop', function () {
        it('should teardown and resolve when initialized', function() {
            waterline.service.teardown = this.sandbox.spy(function(callback) {
                callback();
            });
            this.sandbox.stub(waterline, 'isInitialized').returns(true);
            return waterline.stop();
        });

        it('should resolve when not initialized', function() {
            this.sandbox.stub(waterline, 'isInitialized').returns(false);
            return waterline.stop();
        });
    });

});


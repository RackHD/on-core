// Copyright 2015, EMC, Inc.


'use strict';

describe('Profiles', function () {
    var waterline;
    var loader;
    var Logger;
    var crypto;

    before(function () {
        helper.setupInjector();
        this.subject = helper.injector.get('Profiles');
        this.sandbox = sinon.sandbox.create();
        waterline = helper.injector.get('Services.Waterline');
        loader = helper.injector.get('FileLoader');
        Logger = helper.injector.get('Logger');
        crypto = helper.injector.get('crypto');
        Logger.prototype.log = sinon.spy();
    });

    beforeEach(function() {
        waterline.profiles = {
            findOne: sinon.stub().resolves(),
            find: sinon.stub().resolves(),
            create: sinon.stub().resolves(),
            update: sinon.stub().resolves(),
            destroy: sinon.stub().resolves()
        };
        this.sandbox.stub(loader.prototype, 'get');

        Logger.prototype.log.reset();
    });

    afterEach(function() {
        this.sandbox.restore();
    });

    describe('get', function() {
        it('should get a profile', function() {
            var profile = {
                name: 'test profile',
                scope: 'global',
                path: 'path',
                hash: crypto.createHash('md5').update('test contents').digest('base64')
            };
            waterline.profiles.find.resolves([ profile  ]);
            loader.prototype.get.resolves('test contents');
            return this.subject.get('test profile')
            .then(function(out) {
                expect(out).to.have.property('contents');
                _.forEach(_.keys(out), function(key) {
                    expect(out[key]).to.equal(profile[key] || 'test contents');
                });
                expect(waterline.profiles.find)
                    .to.have.been.calledWith({ name: 'test profile', scope: [ 'global'  ] });
            });
        });

        it('should get a raw profile', function() {
            var profile = {
                name: 'test profile',
                scope: 'global',
                path: 'path',
                hash: crypto.createHash('md5').update('test contents').digest('base64')
            };
            waterline.profiles.find.resolves([ profile  ]);
            loader.prototype.get.resolves('test contents');
            return this.subject.get('test profile', true)
            .then(function(out) {
                expect(out).to.equal('test contents');
                expect(waterline.profiles.find)
                    .to.have.been.calledWith({ name: 'test profile', scope: [ 'global'  ] });
            });
        });
    });
});

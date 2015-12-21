// Copyright 2015, EMC, Inc.


'use strict';

describe('Profiles', function () {
    var waterline;
    var loader;
    var Logger;

    before(function () {
        helper.setupInjector();
        this.subject = helper.injector.get('Profiles');

        waterline = helper.injector.get('Services.Waterline');
        loader = helper.injector.get('FileLoader');
        Logger = helper.injector.get('Logger');

        Logger.prototype.log = sinon.spy();
    });

    beforeEach(function() {
        waterline.profiles = {
            findOne: sinon.stub().resolves(),
            find: sinon.stub().resolves(),
            create: sinon.stub().resolves(),
            update: sinon.stub().resolves()
        };

        loader.prototype.getAll = sinon.stub();

        Logger.prototype.log.reset();
    });

    describe('loading', function() {
        var put;
        before(function() {
            put = this.subject.put;
            this.subject.put = sinon.stub().resolves();
        });

        beforeEach(function() {
            this.subject.put.reset();
        });

        after(function() {
            this.subject.put = put;
        });

        it('should have a loader', function() {
            var FileLoader = helper.injector.get('FileLoader');
            expect(this.subject.loader).to.be.an.instanceof(FileLoader);
        });

        it('should load profiles', function() {
            var self = this;
            var profiles = [
                { name: 'profile 1', contents: new Buffer('profile 1 contents') },
                { name: 'profile 2', contents: new Buffer('profile 2 contents') },
                { name: 'profile 3', contents: new Buffer('profile 3 contents') }
            ];
            loader.prototype.getAll.resolves(profiles);

            return this.subject.load()
            .then(function() {
                expect(self.subject.put.firstCall.args[1]).to.deep.equal(profiles[0].toString());
                expect(self.subject.put.secondCall.args[1]).to.deep.equal(profiles[1].toString());
                expect(self.subject.put.thirdCall.args[1]).to.deep.equal(profiles[2].toString());
            });
        });
    });

    describe('get/put', function() {
        it('should get all profiles', function() {
            this.subject.getAll();
            expect(waterline.profiles.find).to.have.been.calledOnce;
        });

        it('should get a profile', function() {
            waterline.profiles.findOne.resolves('test contents');
            return this.subject.get('test profile')
            .then(function(out) {
                expect(out).to.equal('test contents');
                expect(waterline.profiles.findOne)
                    .to.have.been.calledWith({ name: 'test profile' });
            });
        });

        it('should get a raw profile', function() {
            waterline.profiles.findOne.resolves({
                contents: 'test contents'
            });
            return this.subject.get('test profile', true)
            .then(function(out) {
                expect(out).to.equal('test contents');
                expect(waterline.profiles.findOne)
                    .to.have.been.calledWith({ name: 'test profile' });
            });
        });

        it('should create a new profile', function() {
            var self = this;
            waterline.profiles.findOne.resolves(null);
            return self.subject.put('test profile', 'test contents')
            .then(function() {
                expect(waterline.profiles.create).to.have.been.calledWith({
                    name: 'test profile',
                    contents: 'test contents'
                });
            });
        });

        it('should update an existing profile', function() {
            var self = this;
            waterline.profiles.findOne.resolves('not empty');
            return self.subject.put('test profile', 'test contents')
            .then(function() {
                expect(waterline.profiles.update).to.have.been.calledWith(
                    { name: 'test profile' },
                    { contents: 'test contents' }
                );
            });
        });
    });

    describe('failure logging', function() {
        var nodeEnv;

        before(function() {
            nodeEnv = process.env.NODE_ENV;
        });

        beforeEach(function() {
            loader.prototype.getAll.rejects(new Error());
        });

        after(function() {
            process.env.NODE_ENV = nodeEnv;
        });

        it('should log warnings on load failure', function() {
            process.env.NODE_ENV = 'not test';
            return this.subject.load()
            .then(function() {
                expect(Logger.prototype.log).to.have.been.calledWithMatch(
                    'error', /Unable to load profiles/, { error: new Error() });
            });
        });

        it('should not log warnings in test env', function() {
            process.env.NODE_ENV = 'test';
            return this.subject.load()
            .then(function() {
                expect(Logger.prototype.log).to.not.have.been.calledWithMatch(
                    'error', /Unable to load profiles/, { error: new Error() });
            });
        });
    });
});

// Copyright 2016, EMC, Inc.


'use strict';

describe('db-renderable-content', function () {
    var waterline;
    var loader;
    var Logger;

    before(function () {
        helper.setupInjector();
        var DbRenderable = helper.injector.get('DbRenderableContent');
        this.subject = new DbRenderable();
        this.subject.collectionName = 'things';

        waterline = helper.injector.get('Services.Waterline');
        loader = helper.injector.get('FileLoader');
        Logger = helper.injector.get('Logger');

        Logger.prototype.log = sinon.spy();
    });

    beforeEach(function() {
        waterline.things = {
            findOne: sinon.stub().resolves(),
            find: sinon.stub().resolves(),
            create: sinon.stub().resolves(),
            update: sinon.stub().resolves(),
            destroy: sinon.stub().resolves()
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

        it('should load things', function() {
            var self = this;
            var things = [
                { name: 'thing 1', contents: new Buffer('thing 1 contents') },
                { name: 'thing 2', contents: new Buffer('thing 2 contents') },
                { name: 'thing 3', contents: new Buffer('thing 3 contents') }
            ];
            loader.prototype.getAll.resolves(things);

            return this.subject.load()
            .then(function() {
                expect(self.subject.put.firstCall.args[1]).to.deep.equal(things[0].toString());
                expect(self.subject.put.secondCall.args[1]).to.deep.equal(things[1].toString());
                expect(self.subject.put.thirdCall.args[1]).to.deep.equal(things[2].toString());
            });
        });
    });

    describe('get/put', function() {
        it('should get all thing', function() {
            this.subject.getAll();
            expect(waterline.things.find).to.have.been.calledOnce;
        });

        it('should get a thing', function() {
            waterline.things.find.resolves(['test contents']);
            return this.subject.get('test thing')
            .then(function(out) {
                expect(out).to.equal('test contents');
                expect(waterline.things.find)
                    .to.have.been.calledWith({ name: 'test thing', scope: ['global'] });
            });
        });

        it('should get the thing in the right scope', function() {
            var things = [
                { name: 'thing', contents: 'global scope', scope: 'global'},
                { name: 'thing', contents: 'a scope', scope: 'a'},
                { name: 'thing', contents: 'b scope', scope: 'b'}
            ];
            var scope = ['b', 'a', 'global'];
            waterline.things.find.resolves(things);
            return this.subject.get('thing', scope)
            .then(function(out) {
                expect(out.contents).to.equal('b scope');
                expect(waterline.things.find)
                    .to.have.been.calledWith({ name: 'thing', scope: scope });
            });
        });

        it('should be empty when the scope does not exist', function() {
            var things = [];
            var scope = ['b'];
            waterline.things.find.resolves(things);
            return this.subject.get('thing', scope)
            .then(function(out) {
                expect(out).to.equal(undefined);
                expect(waterline.things.find)
                    .to.have.been.calledWith({ name: 'thing', scope: scope });
            });
        });

        it('should get the next thing when the scope does not exist', function() {
            var things = [
                { name: 'thing', contents: 'global scope', scope: 'global'},
                { name: 'thing', contents: 'a scope', scope: 'a'}
            ];
            var scope = ['b', 'a', 'global'];
            waterline.things.find.resolves(things);
            return this.subject.get('thing', scope)
            .then(function(out) {
                expect(out.contents).to.equal('a scope');
                expect(waterline.things.find)
                    .to.have.been.calledWith({ name: 'thing', scope: scope });
            });
        });

        it('should create a new thing in global scope', function() {
            var self = this;
            waterline.things.findOne.resolves(null);
            return self.subject.put('test thing', 'test contents')
            .then(function() {
                expect(waterline.things.create).to.have.been.calledWith({
                    name: 'test thing',
                    contents: 'test contents',
                    scope: 'global'
                });
            });
        });

        it('should create a new thing in the specified scope', function() {
            var self = this;
            waterline.things.findOne.resolves(null);
            return self.subject.put('test thing', 'test contents', 'sku')
            .then(function() {
                expect(waterline.things.create).to.have.been.calledWith({
                    name: 'test thing',
                    contents: 'test contents',
                    scope: 'sku'
                });
            });
        });

        it('should update an existing thing', function() {
            var self = this;
            waterline.things.findOne.resolves('not empty');
            return self.subject.put('test thing', 'test contents', 'sku')
            .then(function() {
                expect(waterline.things.update).to.have.been.calledWith(
                    { name: 'test thing', scope: 'sku' },
                    { contents: 'test contents' }
                );
            });
        });

        it('should delete a thing in the global scope', function() {
            var self = this;
            waterline.things.destroy.resolves();
            return self.subject.unlink('it')
            .then(function() {
                expect(waterline.things.destroy).to.have.been.calledWith(
                    { name: 'it', scope: 'global' }
                );
            });
        });

        it('should delete a thing in the specified scope', function() {
            var self = this;
            waterline.things.destroy.resolves();
            return self.subject.unlink('it', 'scope')
            .then(function() {
                expect(waterline.things.destroy).to.have.been.calledWith(
                    { name: 'it', scope: 'scope' }
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
                    'error', /Unable to load things/, { error: new Error() });
            });
        });

        it('should not log warnings in test env', function() {
            process.env.NODE_ENV = 'test';
            return this.subject.load()
            .then(function() {
                expect(Logger.prototype.log).to.not.have.been.calledWithMatch(
                    'error', /Unable to load things/, { error: new Error() });
            });
        });
    });

    describe('rendering', function() {
        var get;
        before(function() {
            get = this.subject.get;
            this.subject.get = sinon.stub().resolves();
        });

        beforeEach(function() {
            this.subject.get.reset();
        });

        after(function() {
            this.subject.get = get;
        });

        it('should render a thing', function() {
            var template = 'test <%=variable%> test';
            this.subject.get.resolves({ contents: template });
            return this.subject.render('templatename', { variable: 'rendering' })
            .then(function(rendered) {
                expect(rendered).to.equal('test rendering test');
            });
        });
    });
});

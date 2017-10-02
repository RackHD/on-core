// Copyright 2016, EMC, Inc.


'use strict';

describe('db-renderable-content', function () {
    var waterline;
    var loader;
    var Logger;
    var crypto;
    var EventEmitter = require('events').EventEmitter;

    before(function () {
        helper.setupInjector();
        var DbRenderable = helper.injector.get('DbRenderableContent');
        this.subject = new DbRenderable();
        this.subject.collectionName = 'things';
        this.subject.directory = '/tmp';
        this.sandbox = sinon.sandbox.create();

        waterline = helper.injector.get('Services.Waterline');
        waterline.things = {
            find: sinon.stub().resolves(),
            findOne: sinon.stub().resolves(),
            create: sinon.stub().resolves(),
            destroy: sinon.stub().resolves()
        };
        loader = helper.injector.get('FileLoader');
        Logger = helper.injector.get('Logger');
        crypto = helper.injector.get('crypto');
        Logger.prototype.log = sinon.spy();
    });

    beforeEach(function() {
        this.sandbox.stub(loader.prototype, 'getAll');
        this.sandbox.stub(loader.prototype, 'get');
        this.sandbox.stub(loader.prototype, 'put');
        this.sandbox.stub(loader.prototype, 'unlink');

        Logger.prototype.log.reset();
    });

    afterEach(function() {
        this.sandbox.restore();
    });

    describe('loading', function() {
        beforeEach(function() {
            waterline.things.find = sinon.stub();
            waterline.things.findOne = sinon.stub();
            waterline.things.create = sinon.stub();
        });

        it('should have a loader', function() {
            var FileLoader = helper.injector.get('FileLoader');
            expect(this.subject.loader).to.be.an.instanceof(FileLoader);
        });

        it('should load base things', function() {
            var things = {
                'thing0': {
                    path: 'path/to/thing0',
                    contents: new Buffer('thing 0 contents')
                },
                'thing1': {
                    path: 'path/to/thing1',
                    contents: new Buffer('thing 1 contents')
                }
            };
            loader.prototype.getAll.resolves(things);
            waterline.things.create.returnsArg(0).resolves();

            return this.subject.load()
            .then(function(meta) {
                _.forEach(meta, function(m, i) {
                    var id = i.toString();
                    expect(m).to.have.property('name').and.to.equal('thing' + id);
                    expect(m).to.have.property('path').and.to.equal('path/to/thing' + id);
                    expect(m).to.have.property('scope').and.to.equal('global');
                    expect(m).to.have.property('hash');
                });
            });
        });

        it('should load existing base things', function() {
            var things = {
                'thing0': {
                    path: 'path/to/thing0',
                    contents: new Buffer('thing 0 contents')
                },
                'thing1': {
                    path: 'path/to/thing1',
                    contents: new Buffer('thing 1 contents')
                }
            };

            var records = [
                {
                    name: 'thing0',
                    hash: 'some hash',
                    scope: 'global',
                    path: 'path/to/thing0',
                    save: sinon.stub().returnsThis().resolves()
                },
                {
                    name: 'thing1',
                    scope: 'global',
                    hash: 'some hash',
                    path: 'path/to/thing1',
                    save: sinon.stub().returnsThis().resolves()
                }
            ];
            loader.prototype.getAll.resolves(things);
            _.forEach(records, function(record, i) {
                waterline.things.findOne.onCall(i).resolves(record);
            });

            return this.subject.load()
            .then(function(meta) {
                _.forEach(meta, function(m, i) {
                    var id = i.toString();
                    expect(m).to.have.property('name').and.to.equal('thing' + id);
                    expect(m).to.have.property('path').and.to.equal('path/to/thing' + id);
                    expect(m).to.have.property('scope').and.to.equal('global');
                    expect(m).to.have.property('hash');
                    expect(records[i].save.calledOnce).to.be.true;
                });
            });
        });
    });

    describe('get/put', function() {
        beforeEach(function() {
            waterline.things.find = sinon.stub();
            waterline.things.findOne = sinon.stub();
            waterline.things.create = sinon.stub();
        });

        it('should get all thing', function() {
            this.subject.getAll();
            expect(waterline.things.find).to.have.been.calledOnce;
        });

        it('should get a thing by name', function() {
            var things = [
                { name: 'thing0', path: 'global', scope: 'global', hash: 'hash0'},
                { name: 'thing0', path: 'a scope', scope: 'a', hash: 'hash1'},
                { name: 'thing0', path: 'b scope', scope: 'b', hash: 'hash2'}
            ];
            waterline.things.find.resolves(things);
            return this.subject.getName('thing0').then(function(out) {
                expect(out).to.be.an('array');
                expect(out.length).to.equal(3);
                expect(waterline.things.find).to.be.calledWith({name: 'thing0'});
                _.forEach(out, function(item) {
                    expect(item).to.have.keys(
                        'name', 'path', 'scope', 'hash'
                    );
                });
            });
        });

        it('should get a thing by name and scope', function() {
            var things = [
                { name: 'thing0', path: 'global', scope: 'global', hash: 'hash0'},
                { name: 'thing0', path: 'a scope', scope: 'a', hash: 'hash1'},
                { name: 'thing0', path: 'b scope', scope: 'b', hash: 'hash2'}
            ];
            waterline.things.find.resolves(things);
            return this.subject.getName('thing0', 'a').then(function(out) {
                expect(out).to.be.an('array');
                expect(out.length).to.equal(1);
                expect(waterline.things.find).to.be.calledWith({name: 'thing0'});
                expect(out[0].scope).to.equal('a');
            });
        });

        it('should not get a thing by invalid name', function() {
            var things = [];
            waterline.things.find.resolves(things);
            return this.subject.getName('thing1')
                .should.be.rejectedWith(/does not exist/);
        });

        it('should get a thing', function() {
            var thing = {
                name: 'test thing',
                scope: 'global',
                path: 'path',
                hash: crypto.createHash('md5').update('test contents').digest('base64')
            };
            waterline.things.find.resolves([ thing ]);
            loader.prototype.get.resolves('test contents');
            return this.subject.get('test thing')
            .then(function(out) {
                expect(out).to.have.property('contents');
                _.forEach(_.keys(out), function(key) {
                    expect(out[key]).to.equal(thing[key] || 'test contents');
                });
                expect(waterline.things.find)
                    .to.have.been.calledWith({ name: 'test thing' });
            });
        });

        it('should not get an invalid thing', function() {
            var thing = {
                name: 'test thing',
                scope: 'global',
                path: 'path',
                hash: 'not the right hash'
            };
            waterline.things.find.resolves([ thing ]);
            loader.prototype.get.resolves('test contents');
            return this.subject.get('test thing')
                .should.be.rejectedWith(/template hash mismatch/);
        });

        it('should get the thing in the right scope', function() {
            var things = [
                { name: 'thing', path: 'global', scope: 'global'},
                { name: 'thing', path: 'a scope', scope: 'a'},
                { name: 'thing', path: 'b scope', scope: 'b'}
            ];
            var scope = ['b', 'a', 'global'];
            waterline.things.find.resolves(things);
            _.forEach(things, function(thing) {
                loader.prototype.get.withArgs(thing.path).resolves(thing.path);
                thing.hash = crypto.createHash('md5').update(thing.path).digest('base64');
            });
            return this.subject.get('thing', scope)
            .then(function(out) {
                expect(out.contents).to.equal('b scope');
                expect(waterline.things.find)
                    .to.have.been.calledWith({ name: 'thing' });
            });
        });

        it('should be empty when the scope does not exist', function() {
            var scope = ['b'];
            waterline.things.find.resolves([]);
            return this.subject.get('thing', scope)
            .then(function(out) {
                expect(out).to.equal(undefined);
                expect(waterline.things.find)
                    .to.have.been.calledWith({ name: 'thing' });
            });
        });

        it('should get the next thing when the scope does not exist', function() {
            var things = [
                { name: 'thing', path: 'global', scope: 'global'},
                { name: 'thing', path: 'a scope', scope: 'a'}
            ];
            var scope = ['b', 'a', 'global'];
            waterline.things.find.resolves(things);
            _.forEach(things, function(thing) {
                loader.prototype.get.withArgs(thing.path).resolves(thing.path);
                thing.hash = crypto.createHash('md5').update(thing.path).digest('base64');
            });
            return this.subject.get('thing', scope)
            .then(function(out) {
                expect(out.contents).to.equal('a scope');
                expect(waterline.things.find)
                    .to.have.been.calledWith({ name: 'thing' });
            });
        });

        it('should not get the thing that is not in the scope', function() {
            var things = [
                { name: 'thing', path: 'b scope', scope: 'b'},
                { name: 'thing', path: 'global', scope: 'global'},
                { name: 'thing', path: 'a scope', scope: 'a'}
            ];
            var scope = ['a', 'global'];
            waterline.things.find.resolves(things);
            _.forEach(things, function(thing) {
                loader.prototype.get.withArgs(thing.path).resolves(thing.path);
                thing.hash = crypto.createHash('md5').update(thing.path).digest('base64');
            });
            return this.subject.get('thing', scope)
            .then(function(out) {
                expect(out.contents).to.equal('a scope');
                expect(waterline.things.find)
                    .to.have.been.calledWith({ name: 'thing' });
            });
        });

        it('should create a new thing in global scope', function() {
            var self = this;
            var stream = new EventEmitter();
            var promise;

            waterline.things.findOne.resolves(null);
            waterline.things.create.returnsArg(0).resolves();
            promise =  self.subject.put('test thing', stream);
            stream.emit('data', new Buffer('test '));
            stream.emit('data', new Buffer('thing'));
            stream.emit('end');
            return promise.then(function(thing) {
                expect(thing.name).to.equal('test thing');
                expect(thing.scope).to.equal('global');
                expect(loader.prototype.put).to.have.been.calledWith(
                    thing.path,
                    'test thing'
                );
            });
        });

        it('should create a new thing in the specified scope', function() {
            var self = this;
            var stream = new EventEmitter();
            var promise;

            waterline.things.findOne.resolves(null);
            waterline.things.create.returnsArg(0).resolves();
            promise =  self.subject.put('test thing', stream, 'sku');
            stream.emit('data', new Buffer('test '));
            stream.emit('data', new Buffer('thing'));
            stream.emit('end');
            return promise.then(function(thing) {
                expect(thing.name).to.equal('test thing');
                expect(thing.scope).to.equal('sku');
                expect(loader.prototype.put).to.have.been.calledWith(
                    thing.path,
                    'test thing'
                );
            });
        });

        it('should create a new thing from a pre-streamed file', function() {
            var self = this;
            var stream = {
                data:"anydata",
                req: "streamedDataFromOnhttp"
            };
            var promise;

            waterline.things.findOne.resolves(null);
            waterline.things.create.returnsArg(0).resolves();
            promise =  self.subject.put('test thing', stream);
            return promise.then(function(thing) {
                expect(thing.name).to.equal('test thing');
                expect(thing.scope).to.equal('global');
            });
        });

        it('should create a new thing in the specified scope with new path', function() {
            var self = this;
            var stream = new EventEmitter();
            var promise;
            var record = {
                name: 'a thing',
                path: '/tmp/a thing',
                scope: 'global',
            };

            waterline.things.findOne.onCall(0).resolves(record);
            waterline.things.findOne.onCall(1).resolves();
            waterline.things.create.returnsArg(0).resolves();
            promise =  self.subject.put('a thing', stream, 'sku');
            stream.emit('data', new Buffer('test '));
            stream.emit('data', new Buffer('data'));
            stream.emit('end');
            return promise.then(function(thing) {
                expect(thing.name).to.equal('a thing');
                expect(thing.scope).to.equal('sku');
                expect(thing.path).to.match(/::/);
                expect(loader.prototype.put).to.have.been.calledWith(
                    thing.path,
                    'test data'
                );
            });
        });

        it('should update an existing thing', function() {
            var self = this;
            var stream = new EventEmitter();
            var promise;
            var record = {
                name: 'a thing',
                path: '/tmp/a thing',
                scope: 'global',
                save: sinon.stub().returnsThis().resolves()
            };

            waterline.things.findOne.resolves(record);
            waterline.things.create.returnsArg(0).resolves();
            promise =  self.subject.put('a thing', stream);
            stream.emit('data', new Buffer('test '));
            stream.emit('data', new Buffer('data'));
            stream.emit('end');
            return promise.then(function(thing) {
                expect(thing.name).to.equal('a thing');
                expect(thing.scope).to.equal('global');
                expect(thing.path).not.to.match(/::/);
                expect(loader.prototype.put).to.have.been.calledWith(
                    thing.path,
                    'test data'
                );
            });
        });

        it('should handle a stream error', function() {
            var self = this;
            var stream = new EventEmitter();
            var promise;

            promise =  self.subject.put('a thing', stream);
            stream.emit('error', new Error('an error'));

            return promise.should.be.rejectedWith(/an error/);
        });

        it('should delete a thing in the global scope', function() {
            var self = this;

            loader.prototype.unlink.resolves();
            waterline.things.destroy.resolves();
            waterline.things.findOne.resolves({
                name: 'it',
                path: '/tmp/foo',
                scope: 'global'
            });
            return self.subject.unlink('it')
            .then(function() {
                expect(loader.prototype.unlink).to.have.been.calledWith('/tmp/foo');
                expect(waterline.things.destroy).to.have.been.calledWith(
                    { name: 'it', scope: 'global' }
                );
            });
        });

        it('should delete a thing in the specified scope', function() {
            var self = this;

            loader.prototype.unlink.resolves();
            waterline.things.destroy.resolves();
            waterline.things.findOne.resolves({
                name: 'it',
                path: '/tmp/foo',
                scope: 'global'
            });
            return self.subject.unlink('it', 'scope')
            .then(function() {
                expect(loader.prototype.unlink).to.have.been.calledWith('/tmp/foo');
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
/*
        getName
*/
});

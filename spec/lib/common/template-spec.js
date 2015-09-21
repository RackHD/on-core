// Copyright 2015, EMC, Inc.


'use strict';

describe('Templates', function () {
    var waterline;
    var loader;
    var Logger;

    before(function () {
        helper.setupInjector();
        this.subject = helper.injector.get('Templates');

        waterline = helper.injector.get('Services.Waterline');
        loader = helper.injector.get('FileLoader');
        Logger = helper.injector.get('Logger');

        Logger.prototype.log = sinon.spy();
    });

    beforeEach(function() {
        waterline.templates = {
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

        it('should load templates', function() {
            var self = this;
            var templates = [
                { name: 'template 1', contents: 'template 1 contents'},
                { name: 'template 2', contents: 'template 2 contents'},
                { name: 'template 3', contents: 'template 3 contents'}
            ];
            loader.prototype.getAll.resolves(templates);

            return this.subject.load()
            .then(function() {
                expect(self.subject.put.firstCall.args[1]).to.deep.equal(templates[0]);
                expect(self.subject.put.secondCall.args[1]).to.deep.equal(templates[1]);
                expect(self.subject.put.thirdCall.args[1]).to.deep.equal(templates[2]);
            });
        });
    });

    describe('get/put', function() {
        it('should get all templates', function() {
            this.subject.getAll();
            expect(waterline.templates.find).to.have.been.calledOnce;
        });

        it('should get a template', function() {
            waterline.templates.findOne.resolves('test contents');
            return this.subject.get('test template')
            .then(function(out) {
                expect(out).to.equal('test contents');
                expect(waterline.templates.findOne)
                    .to.have.been.calledWith({ name: 'test template' });
            });
        });

        it('should create a new template', function() {
            var self = this;
            waterline.templates.findOne.resolves(null);
            return self.subject.put('test template', 'test contents')
            .then(function() {
                expect(waterline.templates.create).to.have.been.calledWith({
                    name: 'test template',
                    contents: 'test contents'
                });
            });
        });

        it('should update an existing template', function() {
            var self = this;
            waterline.templates.findOne.resolves('not empty');
            return self.subject.put('test template', 'test contents')
            .then(function() {
                expect(waterline.templates.update).to.have.been.calledWith(
                    { name: 'test template' },
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
                    'warning', /Unable to load templates/, { error: new Error() });
            });
        });

        it('should not log warnings in test env', function() {
            process.env.NODE_ENV = 'test';
            return this.subject.load()
            .then(function() {
                expect(Logger.prototype.log).to.not.have.been.calledWithMatch(
                    'warning', /Unable to load templates/, { error: new Error() });
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

        it('should render a template', function() {
            var template = 'test <%=variable%> test';
            this.subject.get.resolves({ contents: template });
            return this.subject.render('templatename', { variable: 'rendering' })
            .then(function(rendered) {
                expect(rendered).to.equal('test rendering test');
            });
        });
    });
});

// Copyright 2015, EMC, Inc.
/* jslint node: true */
'use strict';

describe('dihelper', function () {
    var di = require('di');
    describe("initialized ", function () {
        var dihelper = helper.require('/lib/di')(di);

        it('initialized ok', function () {
            should.exist(dihelper);
            dihelper.should.be.an('object');
        });

        describe('simpleWrapper', function () {
            var simpleWrapper = dihelper.simpleWrapper;

            it('exists', function () {
                should.exist(simpleWrapper);
            });
            it('is a function', function () {
                simpleWrapper.should.be.a('function');
            });

            describe('can inject an object', function () {
                it('simple object returns same', function () {
                    var fooObject = {foo: 'bar'};
                    var injector = new di.Injector([simpleWrapper(fooObject, 'foo')]);
                    var retrievedObject = injector.get('foo');
                    fooObject.should.equal(retrievedObject);
                });
                it('decorated simple object returns same', function () {
                    var fooObject = {foo: 'bar', $provide: 'foo'};
                    var injector = new di.Injector([simpleWrapper(fooObject)]);
                    var retrievedObject = injector.get('foo');
                    fooObject.should.equal(retrievedObject);
                });
                it('decorated simple object with override returns same', function () {
                    var fooObject = {foo: 'bar', $provide: 'foo'};
                    var injector = new di.Injector([simpleWrapper(fooObject, 'bar')]);
                    var retrievedObject = injector.get('bar');
                    fooObject.should.equal(retrievedObject);
                });
            });
            describe('can inject string', function () {
                it('simple string returns same', function () {
                    var fooObject = 'bar';
                    var injector = new di.Injector([simpleWrapper(fooObject, 'foo')]);
                    var retrievedObject = injector.get('foo');
                    fooObject.should.equal(retrievedObject);
                });
            });

            describe('can inject a function', function () {
                describe('just function provide', function () {
                    it('simple function returns same function', function () {
                        var fooObject = function (val) {
                            return 'before:' + val + ':after';
                        };
                        var injector = new di.Injector([simpleWrapper(fooObject, 'foo')]);
                        var getBack = injector.get('foo');
                        fooObject.should.equal(getBack);
                        var outputFoo = fooObject('test');
                        var outputBack = getBack('test');
                        outputFoo.should.eql(outputBack);
                    });
                    it('function returns same function', function () {
                        var fooObject = function (val) {
                            return 'before:' + val + ':after';
                        };
                        fooObject.testProperty = 'my test property';
                        var injector = new di.Injector([simpleWrapper(fooObject, 'foo')]);
                        var getBack = injector.get('foo');
                        fooObject.should.equal(getBack);
                        fooObject.testProperty.should.eql(getBack.testProperty);
                        var outputFoo = fooObject('test');
                        var outputBack = getBack('test');
                        outputFoo.should.eql(outputBack);
                    });
                    it('function decorated returns same', function () {
                        var fooObject = function () {
                            console.log('sample');
                        };
                        fooObject.$provide = 'foo';
                        var injector = new di.Injector([simpleWrapper(fooObject)]);
                        var getBack = injector.get('foo');
                        fooObject.should.equal(getBack);
                    });
                    it('function decorated with overide returns same', function () {
                        var fooObject = function () {
                            console.log('sample');
                        };
                        fooObject.$provide = 'foo';
                        var injector = new di.Injector([simpleWrapper(fooObject,
                            'myOverrideFooName')]);
                        var getBack = injector.get('myOverrideFooName');
                        fooObject.should.equal(getBack);
                    });
                });
                describe('wrap injectable modules', function () {
                    it('baseline', function () {
                        var returnedFunc;

                        function setupFoo(injectedData) {
                            function fooConcat(inputData) {
                                return injectedData + ':' + inputData;
                            }

                            returnedFunc = fooConcat;
                            return fooConcat;
                        }

                        di.annotate(setupFoo, new di.Provide('foo'));

                        var injector = new di.Injector([simpleWrapper(setupFoo, 'foo')]);
                        var getBack = injector.get('foo');
                        setupFoo.should.equal(getBack);
                    });
                });
                describe('override injectable modules', function () {
                    var overrideInjection = dihelper.overrideInjection;
                    it('overide provide and inject', function () {
                        var returnedFunc = (void 0);

                        function setupFoo(injectedData) {
                            function fooConcat(inputData) {
                                return injectedData + ':' + inputData;
                            }

                            returnedFunc = fooConcat;
                            return fooConcat;
                        }

                        di.annotate(setupFoo, new di.Provide('foo'));
                        di.annotate(setupFoo, new di.Inject('foobar'));

                        var injector = new di.Injector(
                            [simpleWrapper('test1', 'basicstring'),
                                overrideInjection(setupFoo, 'bar', 'basicstring')
                            ]);
                        var getBack = injector.get('bar');
                        should.exist(returnedFunc);
                        returnedFunc.should.equal(getBack);
                        var out = getBack('test2');
                        out.should.equal('test1:test2');
                    });
                    it('overide same injectable multiple times', function () {
                        var returnedFunc = (void 0);

                        function setupFoo(injectedData) {
                            function fooConcat(inputData) {
                                return injectedData + ':' + inputData;
                            }

                            returnedFunc = fooConcat;
                            return fooConcat;
                        }

                        di.annotate(setupFoo, new di.Provide('foo'));

                        var injector = new di.Injector([
                            simpleWrapper('test1', 'test1'),
                            simpleWrapper('test2', 'test2'),
                            overrideInjection(setupFoo, 'bar1', 'test1'),
                            overrideInjection(setupFoo, 'bar2', 'test2')
                        ]);
                        var getBack1 = injector.get('bar1');
                        returnedFunc.should.equal(getBack1);
                        var out1 = getBack1('test2');
                        out1.should.equal('test1:test2');

                        var getBack2 = injector.get('bar2');
                        returnedFunc.should.equal(getBack2);
                        var out2 = getBack2('test3');
                        out2.should.equal('test2:test3');
                    });

                });
            });
        });
        describe('and requireWrapper', function () {
            var asRequire = dihelper.requireWrapper;

            it('exists', function () {
                should.exist(asRequire);
                asRequire.should.be.a('function');
            });
            describe('plain library name', function () {
                it('just named library', function () {
                    var injector = new di.Injector([asRequire('lodash')]);
                    var injected = injector.get('lodash');
                    injected.VERSION.should.be.a('string');
                });
            });
            describe('plain library name change injected name', function () {
                it('just named library', function () {
                    var injector = new di.Injector([asRequire('lodash', 'fooService')]);
                    var injected = injector.get('fooService');
                    injected.VERSION.should.be.a('string');
                });
            });
        });
        describe('requireGlob', function () {
            it('exists', function () {
                should.exist(dihelper.requireGlob);
            });

            it('should require across directories', function () {
                dihelper.requireGlob(__dirname + '/files/**/*.js');
            });

            it('should require specific files without globs', function () {
                dihelper.requireGlob(__dirname + '/files/a/a.js');
            });
        });

        describe('requireGlobInjectables', function () {
            it('exists', function () {
                should.exist(dihelper.requireGlobInjectables);
            });

            it('should require across directories', function () {
                dihelper.requireGlobInjectables(__dirname + '/files/**/*.js');
            });

            it('should require specific files without globs', function () {
                dihelper.requireGlobInjectables(__dirname + '/files/a/a-injectable.js');
            });
        });
        describe('getAsChild', function () {
            var simpleWrapper = dihelper.simpleWrapper;
            it('basic return from function', function () {
                var fooObject = function (val) {
                    return 'before:' + val + ':after';
                };
                di.annotate(fooObject, new di.Inject('bar'));

                var barval = 'barval';
                var injector = new di.Injector([simpleWrapper(barval, 'bar')]);
                var outputBack = injector.getAsChild(fooObject);
                var outputFoo = fooObject(barval);
                outputFoo.should.eql(outputBack);
            });
        });
        describe('exec', function () {
            var simpleWrapper = dihelper.simpleWrapper;
            it("should throw error if last argument isn't a function", function() {
                var fooObject = {};
                var injector = new di.Injector([]);
                expect(function() {
                    injector.exec('blah', fooObject);
                }).to.throw(Error, 'last argument must be a function');
            });
            it('empty injector string val', function () {
                var fooObject = function (val) {
                    return 'before:' + val + ':after';
                };
                di.annotate(fooObject, new di.Inject('bar'));
                var barval = 'barval';
                var injector = new di.Injector([]);
                var outputBack = injector.exec(barval, fooObject);
                var outputFoo = fooObject(barval);
                outputFoo.should.eql(outputBack);
            });
            it('empty injector literal ob format', function () {
                var fooObject = function (val) {
                    return 'before:' + val + ':after';
                };
                di.annotate(fooObject, new di.Inject('bar'));
                var barval = 'barval';
                var injector = new di.Injector([]);
                var outputBack = injector.exec({literal: barval}, fooObject);
                var outputFoo = fooObject(barval);
                outputFoo.should.eql(outputBack);
            });
            it('exec with injected val with string token for injection', function () {
                var fooObject = function (val) {
                    return 'before:' + val + ':after';
                };
                di.annotate(fooObject, new di.Inject('bar'));
                var barval = 'barval';
                var injector = new di.Injector([simpleWrapper(barval, 'bar')]);
                var outputBack = injector.exec('bar', fooObject);
                var outputFoo = fooObject(barval);
                outputFoo.should.eql(outputBack);
            });
            it('exec with injected string using literal with module of same name in injector',
                function () {
                    var fooObject = function (val) {
                        return 'before:' + val + ':after';
                    };
                    di.annotate(fooObject, new di.Inject('bar'));
                    var barval = 'barval';
                    var injector = new di.Injector([simpleWrapper(barval, 'bar')]);
                    var outputBack = injector.exec({literal: 'bar'}, fooObject);
                    var outputFoo = fooObject('bar');
                    outputFoo.should.eql(outputBack);
            });
        });
        describe('childExec', function () {
            var simpleWrapper = dihelper.simpleWrapper;
            it('should take a list of arguments', function () {
                var foo = {foo: 1};
                var injector = new di.Injector();
                injector.childExec(
                    simpleWrapper(foo, 'foo'),
                    function (foo_) {
                        foo_.should.equal(foo);
                    });
            });
            it("should throw error if last argument isn't a function", function() {
                var foo = {foo: 1};
                var injector = new di.Injector();
                expect(function() {
                    injector.childExec(
                        simpleWrapper(foo, 'foo'),
                        { notAFunction: 1 });
                }).to.throw(Error, 'last argument must be a function');
            });
        });

        describe('getMatching', function () {
            var simpleWrapper = dihelper.simpleWrapper;
            var foo = {foo: 1};
            var bar = {bar: 2};
            var baz = {baz: 3};

            var injector = new di.Injector([
                simpleWrapper(foo, 'module.foo'),
                simpleWrapper(bar, 'module/bar'),
                simpleWrapper(baz, 'module::baz')
            ]);

            function verifyModules(given, expected) {
                given.should.have.length(expected.length);
                expected.forEach(function (mod) {
                    given.should.include(mod);
                });
            }
            it('should throw an error if not a string or regex', function () {
                expect(function() {
                    injector.getMatching({});
                }).to.throw(Error, 'pattern must be a string or RegExp');
            });

            it('should get tokens split by a dot using a wildcard character', function () {
                var modules = injector.getMatching('module.*');
                verifyModules(modules, [foo, bar, baz]);
            });

            it('should get tokens split by a slash using a wildcard character', function () {
                var modules = injector.getMatching('module/*');
                verifyModules(modules, [foo, bar, baz]);
            });

            it('should get tokens split by a double colon using a wildcard character', function () {
                var modules = injector.getMatching('module::*');
                verifyModules(modules, [foo, bar, baz]);
            });

            it('should get tokens from a child injector', function () {
                var qux = {qux: 4};
                var childInjector = injector.createChild([
                    simpleWrapper(qux, 'module.qux'),
                ]);
                var modules = childInjector.getMatching('module.*');
                verifyModules(modules, [foo, bar, baz, qux]);
            });
        });
    });
    describe("provideName", function() {
        it("should throw an error if token isn't a string", function() {
            var dihelper = helper.require('/lib/di')(di);
            expect(function() {
                dihelper.testFunctions.provideName({}, 123);
            }).to.throw(Error, 'Must provide string as name of module');
        });
    });
    describe("addInject", function() {
        it("should return immediately if inject doesn't exist", function() {
            var obj = {};
            var dihelper = helper.require('/lib/di')(di);
            dihelper.testFunctions.addInject(obj);
        });
    });
});


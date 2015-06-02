// Copyright (c) 2015, EMC Corporation


'use strict';

var base = require('./base-spec');

describe('Models.Catalog', function () {
    helper.before();

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').catalogs;
        context.attributes = context.model._attributes;
    });

    helper.after();

    describe('Base', function () {
        base.examples();
    });

    describe('Attributes', function () {
        describe('node', function () {
            before(function () {
                this.subject = this.attributes.node;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be a relation to the nodes model', function () {
                expect(this.subject.model).to.equal('nodes');
            });
        });

        describe('source', function () {
            before(function () {
                this.subject = this.attributes.source;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });
        });

        describe('data', function () {
            before(function () {
                this.subject = this.attributes.data;
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should be json', function () {
                expect(this.subject.type).to.equal('json');
                expect(this.subject.json).to.equal(true);
            });
        });
    });

    describe('creation', function() {
        it('should create a catalog', function() {
            return this.model.create({
                node: "54d93422b492492333333333",
                source: 'testcatalog',
                data: {
                    testvalue1: 'test1',
                    testvalue2: 'test2',
                    testarray1: [
                        {
                            testarrayvalue1: 'test3'
                        }
                    ]
                }
            });
        });

        it('should replace dots in catalog keys with underscores', function() {
            return this.model.create({
                node: "54d93422b492492313333333",
                source: 'testcatalog2',
                data: {
                    'testvalue1.test': 'test1'
                }
            }).then(function (catalog) {
                /*jshint sub: true */
                expect(catalog.data['testvalue1_test']).to.equal('test1');
            });
        });

        it('should replace dollar signs in catalog keys with underscores', function() {
            return this.model.create({
                node: "54d93422b492492323333333",
                source: 'testcatalog3',
                data: {
                    'testvalue1$test': 'test1'
                }
            }).then(function (catalog) {
                /*jshint sub: true */
                expect(catalog.data['testvalue1_test']).to.equal('test1');
            });
        });
    });

    describe('findLatestCatalogOfSource', function () {

        var nodes;
        var catalogs;
        var nodeId;

        before("findLatestCatalogOfSource before", function() {
            nodes = helper.injector.get('Services.Waterline').nodes;
            catalogs = this.model;
        });

        beforeEach('reset DB collections', function () {
            return helper.reset();
        });

        beforeEach('create test node with two catalogs', function () {
            return nodes.create({ name: 'testNodeName' })
                .then(function(node) {
                    nodeId = node.id;
                    //console.log("Node ID: ",nodeId);
                    // create first catalog
                    return catalogs.create({
                        node: nodeId,
                        source: 'testcatalog',
                        data: {
                            testvalue1: 'firstcatalog'
                        }
                    });
                })
                .then(function() {
                    // create second catalog
                    return catalogs.create({
                        node: nodeId,
                        source: 'testcatalog',
                        data: {
                            testvalue1: 'lastcatalog'
                        }
                    });
                });
        });

        it("should return the last catalog created", function() {
            return catalogs.findLatestCatalogOfSource(nodeId, 'testcatalog')
                .then(function(catalogs) {
                    expect(catalogs).to.be.an('Object');
                    expect(catalogs.source).to.equal('testcatalog');
                    expect(catalogs.data.testvalue1).to.equal('lastcatalog');
                });
        });

    });
});

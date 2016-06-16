// Copyright 2015, EMC, Inc.


'use strict';

var base = require('./base-spec');
var  sandbox = sinon.sandbox.create();

describe('Models.Lookup', function () {

    helper.before(function (context) {
        context.MessengerServices = function() {
            this.start= sandbox.stub().resolves();
            this.stop = sandbox.stub().resolves();
            this.publish = sandbox.stub().resolves();
        };
        return [
            helper.di.simpleWrapper(context.MessengerServices, 'Messenger')
        ];
    });

    base.before(function (context) {
        context.model = helper.injector.get('Services.Waterline').lookups;
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

            it('should be a relation to the nodes model', function () {
                expect(this.subject.model).to.equal('nodes');
            });
        });

        describe('ipAddress', function () {
            before(function () {
                this.subject = this.attributes.ipAddress;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be unique', function() {
                expect(this.subject.unique).to.equal(true);
            });
        });

        describe('macAddress', function () {
            before(function () {
                this.subject = this.attributes.macAddress;
            });

            it('should be a string', function () {
                expect(this.subject.type).to.equal('string');
            });

            it('should be required', function () {
                expect(this.subject.required).to.equal(true);
            });

            it('should regex with /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/', function() {
                expect(
                    this.subject.regex.toString()
                ).to.equal('/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/');
            });

            it('should be unique', function() {
                expect(this.subject.unique).to.equal(true);
            });
        });
    });

    describe('Class Methods', function () {
        var waterline, Errors;

        before(function () {
            waterline = helper.injector.get('Services.Waterline');
            Errors = helper.injector.get('Errors');
        });

        describe('findByTerm', function () {
            it('should call find with the proper mac criteria', function() {
                var find = this.sandbox.stub(waterline.lookups, 'find').resolves([]);

                return waterline.lookups.findByTerm('foo').then(function (records) {
                    expect(records).to.deep.equal([]);
                    expect(find).to.have.been.calledWith({ macAddress: ['foo'] });
                });
            });

            it('should call find with the proper node criteria', function() {
                var bson = require('bson');
                var objId = new bson.ObjectID();
                var find = this.sandbox.stub(waterline.lookups, 'find').resolves([]);

                return waterline.lookups.findByTerm(objId).then(function (records) {
                    expect(records).to.deep.equal([]);
                    expect(find).to.have.been.calledWith({ node: objId });
                });
            });

            it('should call find with the proper ip criteria', function() {
                var find = this.sandbox.stub(waterline.lookups, 'find').resolves([]);

                return waterline.lookups.findByTerm('127.0.0.1').then(function (records) {
                    expect(records).to.deep.equal([]);
                    expect(find).to.have.been.calledWith({ ipAddress: '127.0.0.1' });
                });
            });

            it('should call with empty criteria for empty term', function() {
                var find = this.sandbox.stub(waterline.lookups, 'find').resolves([]);

                return waterline.lookups.findByTerm('').then(function (records) {
                    expect(records).to.deep.equal([]);
                    expect(find).to.have.been.calledWith({});
                });
            });

            it('should call with empty criteria if no term', function() {
                var find = this.sandbox.stub(waterline.lookups, 'find').resolves([]);

                return waterline.lookups.findByTerm().then(function (records) {
                    expect(records).to.deep.equal([]);
                    expect(find).to.have.been.calledWith({});
                });
            });
        });

        describe('findOneByTerm', function () {
            it('should call findByTerm with the proper term', function() {
                var findByTerm = this.sandbox.stub(
                    waterline.lookups,
                    'findByTerm'
                ).resolves([{
                    id: 'id',
                    macAddress: 'macAddress',
                    ipAddress: 'ipAddress',
                    node: 'node'
                }]);

                return waterline.lookups.findOneByTerm('foo').then(function (record) {
                    expect(findByTerm).to.have.been.calledWith('foo');
                    expect(record.id).to.equal('id');
                });
            });

            it('should reject with Errors.NotFoundError if no records are returned', function() {
                var findByTerm = this.sandbox.stub(
                    waterline.lookups,
                    'findByTerm'
                ).resolves([]);

                return expect(
                    waterline.lookups.findOneByTerm('foo')
                ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                    expect(findByTerm).to.have.been.calledWith('foo');
                });
            });

            it('should reject with Errors.NotFoundError if undefined is returned', function() {
                var findByTerm = this.sandbox.stub(
                    waterline.lookups,
                    'findByTerm'
                ).resolves();

                return expect(
                    waterline.lookups.findOneByTerm('foo')
                ).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                    expect(findByTerm).to.have.been.calledWith('foo');
                });
            });
        });

        describe('upsertNodeToMacAddress', function () {
            it('should update the record with the MAC', function() {
                this.sandbox.stub(waterline.lookups, 'findAndModifyMongo').resolves();
                return waterline.lookups.upsertNodeToMacAddress(
                    'node',
                    'macAddress'
                ).then(function () {
                    expect(waterline.lookups.findAndModifyMongo).to.have.been.calledOnce;
                    var query = { macAddress: 'macAddress' };
                    var update = { $set: { node: 'node' }};
                    expect(waterline.lookups.findAndModifyMongo.firstCall.args[0]).to.deep.equal(query);
                    expect(waterline.lookups.findAndModifyMongo.firstCall.args[2]).to.deep.equal(update);
                });
            });
        });

        describe('upsertProxyToMacAddress', function () {
            it('should update an existing record by mac adddress', function() {
                var record = {
                    id: 'id',
                    macAddress: 'macAddress',
                    ipAddress: 'ipAddress',
                    node: 'node',
                    proxy: 'proxy'
                },
                update = this.sandbox.stub(waterline.lookups, 'update').resolves([record]),
                findOne = this.sandbox.stub(waterline.lookups, 'findOne').resolves(record);

                return waterline.lookups.upsertProxyToMacAddress(
                    'proxy',
                    'macAddress'
                ).then(function () {
                    expect(findOne).to.have.been.calledWith({ macAddress: 'macAddress' });
                    expect(update).to.have.been.calledWith({ id: 'id' }, { proxy: 'proxy' });
                });
            });

            it('should reject with Errors.NotFoundError if no records are returned', function() {
                var findOne = this.sandbox.stub(waterline.lookups, 'findOne').resolves();

                return expect(waterline.lookups.upsertProxyToMacAddress(
                    'proxy',
                    'macAddress'
                )).to.be.rejectedWith(Errors.NotFoundError).then(function () {
                    expect(findOne).to.have.been.calledWith({ macAddress: 'macAddress' });
                });
            });
        });

        describe('setIp', function() {
            var record = {
                ipAddress: '99.99.99.12',
                macAddress: '7a:c0:7a:c0:be:ef'
            };
            it('should set the mac with the ip', function() {

                this.sandbox.stub(waterline.lookups, 'findAndModifyMongo').resolves();

                return waterline.lookups.setIp(record.ipAddress, record.macAddress)
                    .then(function() {
                        expect(waterline.lookups.findAndModifyMongo).to.have.been.calledTwice;

                        var update = {
                            $unset: {
                                ipAddress: ""
                            }
                        };

                        expect(waterline.lookups.findAndModifyMongo.firstCall.args).to.deep.equal(
                            [
                                {
                                    ipAddress: record.ipAddress,
                                    macAddress: { $ne: record.macAddress }
                                },
                                {},
                                update,
                                { new: true }
                            ]
                        );

                        update = {
                            $set: {
                                ipAddress: record.ipAddress
                            },
                            $setOnInsert: {
                                macAddress: record.macAddress
                            }
                        };

                        var options = {
                            upsert: true,
                            new: true
                        };

                        expect(waterline.lookups.findAndModifyMongo.secondCall.args).to.deep.equal(
                            [
                                {
                                    macAddress: record.macAddress
                                },
                                {},
                                update,
                                options
                            ]
                        );
                    });
            });

            it('should have a PostgreSQL handler', function() {
                this.sandbox.stub(waterline.lookups, 'runQuery').resolves();
                this.sandbox.stub(waterline.lookups, 'postgresqlRunLockedQuery').resolves();
                return waterline.lookups.setIpPostgreSQL(record.ipAddress, record.macAddress)
                .then(function() {
                    expect(waterline.lookups.runQuery).to.be.calledOnce;
                    expect(waterline.lookups.postgresqlRunLockedQuery).to.be.calledOnce;
                });
            });
        });

        describe('setIndexes', function () {
            it('should set unique indexes', function() {
                this.sandbox.stub(waterline.lookups, 'createUniqueMongoIndexes').resolves();

                return waterline.lookups.setIndexes().then(function () {
                    expect(waterline.lookups.createUniqueMongoIndexes)
                        .to.have.been.calledOnce;
                    expect(waterline.lookups.createUniqueMongoIndexes)
                        .to.have.been.calledWith([
                            {
                                macAddress: 1
                            },
                            {
                                macAddress: 1, ipAddress: 1
                            }
                        ]);
                });
            });
        });

    });
});

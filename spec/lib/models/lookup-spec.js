// Copyright 2014, Renasar Technologies Inc.
/* jshint node: true */

'use strict';

var base = require('./base-spec');

describe('Models.Lookup', function () {
    helper.before();

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
            it('should call find with the proper criteria', function() {
                var find = this.sandbox.stub(waterline.lookups, 'find').resolves([]);

                return waterline.lookups.findByTerm('foo').then(function (records) {
                    expect(records).to.deep.equal([]);
                    expect(find).to.have.been.calledWith({
                        or: [
                            { node: 'foo' },
                            { macAddress: 'foo' },
                            { ipAddress: 'foo' }
                        ]
                    });
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
            it('should update an existing record by mac adddress', function() {
                var record = {
                    id: 'id',
                    macAddress: 'macAddress',
                    ipAddress: 'ipAddress',
                    node: 'node'
                },
                update = this.sandbox.stub(waterline.lookups, 'update').resolves([record]),
                findOne = this.sandbox.stub(waterline.lookups, 'findOne').resolves(record);

                return waterline.lookups.upsertNodeToMacAddress(
                    'node',
                    'macAddress'
                ).then(function () {
                    expect(findOne).to.have.been.calledWith({ macAddress: 'macAddress' });
                    expect(update).to.have.been.calledWith({ id: 'id' }, { node: 'node' });
                });
            });

            it('should call create if no record is returned by find', function() {
                var record = {
                    id: 'id',
                    macAddress: 'macAddress',
                    ipAddress: 'ipAddress',
                    node: 'node'
                },
                create = this.sandbox.stub(waterline.lookups, 'create').resolves(record),
                findOne = this.sandbox.stub(waterline.lookups, 'findOne').resolves();

                return waterline.lookups.upsertNodeToMacAddress(
                    'node',
                    'macAddress'
                ).then(function () {
                    expect(findOne).to.have.been.calledWith({ macAddress: 'macAddress' });
                    expect(create).to.have.been.calledWith(
                        { node: 'node', macAddress: 'macAddress' }
                    );
                });
            });
        });
    });
});


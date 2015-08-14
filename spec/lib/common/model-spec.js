// Copyright (c) 2015, EMC Corporation


'use strict';

describe('Model', function () {
    var waterline;
    var waterlineProtocol = {
        publishRecord: sinon.stub().returns(Q.resolve())
    };

    var Errors;

    function testModelFactory(Model) {
        return Model.extend({
            connection: 'mongo',
            identity: 'testobjects',
            attributes: {
                dummy: {
                    type: 'string'
                }
            }
        });
    }

    helper.before(function () {
        return [
            helper.di.simpleWrapper(waterlineProtocol, 'Protocol.Waterline'),
            helper.di.overrideInjection(testModelFactory, 'Models.TestObject', ['Model'])
        ];
    });

    before(function () {
        waterline = helper.injector.get('Services.Waterline');
        Errors = helper.injector.get('Errors');
    });

    helper.after();

    describe('newly created record', function () {
        var record;


        before('reset DB collections', function () {
            return helper.reset();
        });

        before('set up mocks', function () {
            waterlineProtocol.publishRecord = sinon.stub().returns(Q.resolve());
        });

        before('create the record with findOrCreateByIdentifier()', function () {
            return waterline.testobjects.findOrCreateByIdentifier('mytestobject', {
                identifiers: [ 'mytestobject', '12341234' ],
                dummy: 'magicstring',
                properties: {
                    foo: 'bar'
                }
            }).then(function (record_) {
                record = record_;
            });
        });

        it('should have an id string', function () {
            expect(record).to.have.property('id').that.is.a('string');
        });

        it('should have an identifiers array', function () {
            expect(record).to.have.property('identifiers').that.is.an.instanceOf(Array);
        });

        it('should have an identifiers array with length 2', function () {
            expect(record).to.have.property('identifiers').with.length(2);
        });

        it('should have an identifiers array that contains the first identifier', function () {
            expect(record).to.have.property('identifiers').that.includes('mytestobject');
        });

        it('should have an identifiers array that contains the second identifier', function () {
            expect(record).to.have.property('identifiers').that.includes('12341234');
        });

        it('should have an extended string attribute', function () {
            expect(record).to.have.property('dummy', 'magicstring');
        });

        it('should have a properties object', function () {
            expect(record).to.have.property('properties').that.is.an('object');
        });

        it('should have a properties.foo string', function () {
            expect(record).to.have.deep.property('properties.foo').that.equals('bar');
        });

        it('should have a createdAt Date', function () {
            expect(record).to.have.property('createdAt').that.is.an.instanceOf(Date);
        });

        it('should have an updatedAt Date', function () {
            expect(record).to.have.property('updatedAt').that.is.an.instanceOf(Date);
        });

        it('should have called publishRecord()', function () {
            expect(waterlineProtocol.publishRecord).to.have.been.calledOnce;
        });

        it('should have called publishRecord() with the correct collection', function () {
            expect(waterlineProtocol.publishRecord.firstCall.args[0])
            .to.have.property('identity').that.equals('testobjects');
        });

        it('should have called publishRecord() with a created event', function () {
            expect(waterlineProtocol.publishRecord.firstCall.args[1]).to.equal('created');
        });

        it('should have called publishRecord() with the correct record', function () {
            expect(waterlineProtocol.publishRecord.firstCall.args[2])
            .to.have.property('id').that.equals(record.id);
        });

        it('should find the record by id with findByIdentifier()', function () {
            return waterline.testobjects.findByIdentifier(record.id).then(function (found) {
                expect(found).to.have.property('id').that.equals(record.id);
            });
        });

        it('should find the record by identifier with findByIdentifier()', function () {
            return waterline.testobjects.findByIdentifier('mytestobject').then(function (found) {
                expect(found).to.have.property('id').that.equals(record.id);
            });
        });

        it('should find the record by id with findByIdentifier()', function () {
            return waterline.testobjects.findByIdentifier('12341234').then(function (found) {
                expect(found).to.have.property('id').that.equals(record.id);
            });
        });

        it('should not find the record with findByIdentifier() with a bad identifier', function () {
            return waterline.testobjects.findByIdentifier('notvalid').then(function (found) {
                expect(found).to.be.undefined;
            });
        });

        it('should find the record by id with findOrCreateByIdentifier()', function () {
            return waterline.testobjects.findOrCreateByIdentifier(record.id, {})
            .should.be.fulfilled.and.eventually.have.property('id').that.equals(record.id);
        });

        it('should find the record by identifier with findOrCreateByIdentifier()', function () {
            return waterline.testobjects.findOrCreateByIdentifier('mytestobject', {})
            .should.be.fulfilled.and.eventually.have.property('id').that.equals(record.id);
        });

        it('should find the record by id with findOrCreateByIdentifier()', function () {
            return waterline.testobjects.findOrCreateByIdentifier('12341234', {})
            .should.be.fulfilled.and.eventually.have.property('id').that.equals(record.id);
        });
    });

    describe('model updating', function () {
        var record;

        before('reset DB collections', function () {
            return helper.reset();
        });

        before('create the record', function () {
            return waterline.testobjects.create({
                identifiers: [ 'updatedobject', '999' ]
            }).then(function (record_) {
                record = record_;
            });
        });

        describe('update by id with updateByIdentifier()', function () {
            var updated;

            before('set up mocks', function () {
                waterlineProtocol.publishRecord = sinon.stub().returns(Q.resolve());
            });

            before('update the record', function () {
                return waterline.testobjects.updateByIdentifier(record.id, {
                    dummy: 'updatemebyid'
                }).then(function (updated_) {
                    updated = updated_;
                });
            });

            it('should have the same id', function () {
                expect(updated).to.have.property('id').that.equals(record.id);
            });

            it('should have an updated dummy string', function () {
                expect(updated).to.have.property('dummy').that.equals('updatemebyid');
            });

            it('should have called publishRecord()', function () {
                expect(waterlineProtocol.publishRecord).to.have.been.calledOnce;
            });

            it('should have called publishRecord() with the correct collection', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[0])
                    .to.have.property('identity').that.equals('testobjects');
            });

            it('should have called publishRecord() with a created event', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[1]).to.equal('updated');
            });

            it('should have called publishRecord() with the correct record', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[2])
                .to.have.property('id').that.equals(record.id);
            });

            it('should have called publishRecord() with the updated dummy string', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[2])
                    .to.have.property('dummy').that.equals('updatemebyid');
            });
        });

        describe('update by identifier with updateByIdentifier()', function () {
            var updated;

            before('set up mocks', function () {
                waterlineProtocol.publishRecord = sinon.stub().returns(Q.resolve());
            });

            before('update the record', function () {
                return waterline.testobjects.updateByIdentifier('updatedobject', {
                    dummy: 'updatemebyidentifier'
                }).then(function (updated_) {
                    updated = updated_;
                });
            });

            it('should have the same id', function () {
                expect(updated).to.have.property('id', record.id);
            });

            it('should have an updated dummy string', function () {
                expect(updated).to.have.property('dummy').that.equals('updatemebyidentifier');
            });

            it('should have called publishRecord()', function () {
                expect(waterlineProtocol.publishRecord).to.have.been.calledOnce;
            });

            it('should have called publishRecord() with the correct collection', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[0])
                    .to.have.property('identity').that.equals('testobjects');
            });

            it('should have called publishRecord() with a created event', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[1]).to.equal('updated');
            });

            it('should have called publishRecord() with the correct record', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[2])
                .to.have.property('id').that.equals(record.id);
            });

            it('should have called publishRecord() with the updated dummy string', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[2])
                    .to.have.property('dummy').that.equals('updatemebyidentifier');
            });
        });

        describe('update by bad identifier with updateByIdentifier()', function () {
            it('should reject with a not found error', function () {
                return waterline.testobjects.updateByIdentifier('invalid object', {
                    dummy: 'updatemebyidentifier'
                }).should.be.rejectedWith(Errors.NotFoundError);
            });
        });
    });


    describe('model destroying', function () {
        var record;

        before('reset DB collections', function () {
            return helper.reset();
        });

        before('create the record', function () {
            return waterline.testobjects.create({})
            .then(function (record_) {
                record = record_;
            });
        });

        describe('destroy with destroy()', function () {
            var destroyed;

            before('set up mocks', function () {
                waterlineProtocol.publishRecord = sinon.stub().returns(Q.resolve());
            });

            before('destroy the record', function () {
                return waterline.testobjects.destroy(record.id, {
                    dummy: 'updatemebyid'
                }).then(function (destroyed_) {
                    destroyed = destroyed_[0];
                });
            });

            it('should have the same id', function () {
                expect(destroyed).to.have.property('id', record.id);
            });

            it('should have called publishRecord()', function () {
                expect(waterlineProtocol.publishRecord).to.have.been.calledOnce;
            });

            it('should have called publishRecord() with the correct collection', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[0])
                    .to.have.property('identity').that.equals('testobjects');
            });

            it('should have called publishRecord() with a created event', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[1]).to.equal('destroyed');
            });

            it('should have called publishRecord() with the correct record', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[2])
                .to.have.property('id').that.equals(record.id);
            });
        });
    });

    describe('model destroying by id', function () {
        var record;

        before('reset DB collections', function () {
            return helper.reset();
        });

        before('create the record', function () {
            return waterline.testobjects.create({})
            .then(function (record_) {
                record = record_;
            });
        });

        describe('destroy with destroyByIdentifier()', function () {
            var destroyed;

            before('set up mocks', function () {
                waterlineProtocol.publishRecord = sinon.stub().returns(Q.resolve());
            });

            before('destroy the record', function () {
                return waterline.testobjects.destroyByIdentifier(record.id)
                .then(function (destroyed_) {
                    destroyed = destroyed_;
                });
            });

            it('should have the same id', function () {
                expect(destroyed).to.have.property('id').that.equals(record.id);
            });

            it('should have called publishRecord()', function () {
                expect(waterlineProtocol.publishRecord).to.have.been.calledOnce;
            });

            it('should have called publishRecord() with the correct collection', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[0])
                    .to.have.property('identity').that.equals('testobjects');
            });

            it('should have called publishRecord() with a created event', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[1]).to.equal('destroyed');
            });

            it('should have called publishRecord() with the correct record', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[2])
                .to.have.property('id').that.equals(record.id);
            });
        });
    });

    describe('model destroying by identifier', function () {
        var record;

        before('reset DB collections', function () {
            return helper.reset();
        });

        before('create the record', function () {
            return waterline.testobjects.create({
                identifiers: [ 'imustbedestroyed', '666' ]
            }).then(function (record_) {
                record = record_;
            });
        });

        describe('destroy with destroyByIdentifier()', function () {
            var destroyed;

            before('set up mocks', function () {
                waterlineProtocol.publishRecord = sinon.stub().returns(Q.resolve());
            });

            before('destroy the record', function () {
                return waterline.testobjects.destroyByIdentifier('imustbedestroyed')
                .then(function (destroyed_) {
                    destroyed = destroyed_;
                });
            });

            it('should have the same id', function () {
                expect(destroyed).to.have.property('id', record.id);
            });

            it('should have called publishRecord()', function () {
                expect(waterlineProtocol.publishRecord).to.have.been.calledOnce;
            });

            it('should have called publishRecord() with the correct collection', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[0])
                    .to.have.property('identity').that.equals('testobjects');
            });

            it('should have called publishRecord() with a created event', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[1]).to.equal('destroyed');
            });

            it('should have called publishRecord() with the correct record', function () {
                expect(waterlineProtocol.publishRecord.firstCall.args[2])
                .to.have.property('id').that.equals(record.id);
            });
        });
    });

    describe('multiple records', function () {
        var records = [];

        before('reset DB collections', function () {
            return helper.reset();
        });

        before('create the records', function () {
            return waterline.testobjects.create({
                dummy: 'magic'
            }).then(function (record) {
                records.push(record);
                return Q.delay();
            }).then(function () {
                return waterline.testobjects.create({
                    dummy: 'magic'
                });
            }).then(function (record) {
                records.push(record);
            });
        });

        it('should find the most recent record with findMostRecent()', function () {
                // second record in the records array should have been created later
            return waterline.testobjects.findMostRecent()
            .should.be.fulfilled.and.eventually.have.property('id', records[1].id);
        });

        it('should find the most recent record with findMostRecent() with a query', function () {
            return waterline.testobjects.findMostRecent({ dummy: 'magic' })
            .should.be.fulfilled.and.eventually.have.property('id').that.equals(records[1].id);
        });

        it('should not find the most recent record with findMostRecent() with a bad query',
           function () {
            return waterline.testobjects.findMostRecent({ dummy: 'notfound' })
            .should.be.fulfilled.and.eventually.be.undefined;
        });

        it('should throw if findSinceLastUpdate() is called without a date', function () {
            expect(function () {
                waterline.testobjects.findSinceLastUpdate();
            }).to.throw(Error);
        });

        it('should find recently updated records with findSinceLastUpdate()', function () {
            return waterline.testobjects.findSinceLastUpdate(records[0].createdAt)
            .should.be.fulfilled.and.eventually.have.length(1)
            .and.eventually.have.deep.property('[0].id').that.equals(records[1].id);
        });

        it('should not find previously updated records with findSinceLastUpdate()', function () {
            return waterline.testobjects.findSinceLastUpdate(records[1].createdAt)
            .should.be.fulfilled.and.eventually.have.length(0);
        });

        it('should find recently updated records with findSinceLastUpdate() with a query',
           function () {
            return waterline.testobjects.findSinceLastUpdate(
                records[0].createdAt,
                { dummy: 'magic'}
            )
            .should.be.fulfilled.and.eventually.have.length(1)
            .and.eventually.have.deep.property('[0].id').that.equals(records[1].id);
        });

        it('should not find previously updated records with findSinceLastUpdate() with a query',
           function () {
            return waterline.testobjects.findSinceLastUpdate(
                records[1].createdAt,
                { dummy: 'magic' }
            )
            .should.be.fulfilled.and.eventually.have.length(0);
        });

        it('should not find recently updated records with findSinceLastUpdate() with a bad query',
           function () {
            return waterline.testobjects.findSinceLastUpdate(
                records[0].createdAt,
                { dummy: 'notfound' }
            )
            .should.be.fulfilled.and.eventually.have.length(0);
        });
    });

    describe('publishRecord() failure', function () {
        beforeEach('set up mocks', function () {
            waterlineProtocol.publishRecord = sinon.stub().returns(Q.resolve());
        });

        it('should cause rejection on create()', function () {
            var error = new Error();
            waterlineProtocol.publishRecord = sinon.stub().returns(Q.reject(error));
            return waterline.testobjects.create({})
            .should.be.rejected.and.eventually.have.property('originalError', error);
        });

        it('should cause rejection on update()', function () {
            var error = new Error();
            return waterline.testobjects.create({}).then(function (record) {
                waterlineProtocol.publishRecord = sinon.stub().returns(Q.reject(error));
                return waterline.testobjects.update(record.id, { dummy: 'test' });
            }).should.be.rejected.and.eventually.have.property('originalError', error);
        });

        it('should cause rejection on destroy()', function () {
            var error = new Error();
            return waterline.testobjects.create({}).then(function (record) {
                waterlineProtocol.publishRecord = sinon.stub().returns(Q.reject(error));
                return waterline.testobjects.destroy(record.id);
            }).should.be.rejected.and.eventually.have.property('originalError', error);
        });
    });
});

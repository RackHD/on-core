// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe(require('path').basename(__filename), function () {
    var waterline;
    function waterlineProtocolFactory(Rx) {
        return {
            observeCollection: sinon.stub().returns(new Rx.Subject()),
            publishRecord: sinon.stub()
        };
    }
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

    beforeEach(function() {
        helper.setupInjector([
            helper.di.overrideInjection(waterlineProtocolFactory, 'Protocol.Waterline', ['Rx']),
            helper.di.overrideInjection(testModelFactory, 'Models.TestObject', ['Model'])
        ]);
        helper.setupTestConfig();
        waterline = helper.injector.get('Services.Waterline');
    });

    it('should start and stop', function () {
        return waterline.start().then(function () {
            return waterline.stop();
        });
    });

    describe('observe()', function () {
        function publish(event, record) {
            var waterlineProtocol = helper.injector.get('Protocol.Waterline');
            expect(waterlineProtocol.observeCollection).to.have.been.calledOnce;
            var subject = waterlineProtocol.observeCollection.returnValues[0];
            subject.onNext({ event: event, record: record });
        }

        beforeEach(function () {
            this.timeout(10000);
            return waterline.start().then(function () {
                return helper.reset();
            });
        });

        afterEach(function () {
            return waterline.stop();
        });

        it('should observe created events on a collection', function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects).subscribe(callback);
            publish('created', { id: 1 });

            expect(callback).to.have.been.calledOnce;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
        });

        it('should observe created events on a collection with query', function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects, { id: 1 }).subscribe(callback);
            publish('created', { id: 1 });

            expect(callback).to.have.been.calledOnce;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
        });

        it('should filter out events on a collection with non-matching query',
           function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects, { id: 2 }).subscribe(callback);
            publish('created', { id: 1 });

            expect(callback).to.not.have.been.called;
        });

        it('should observe a created event with an matching query', function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects.findByIdentifier(1)).subscribe(callback);
            publish('created', { id: 1 });

            expect(callback).to.have.been.calledOnce;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
        });

        it('should observe updated events', function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects.find({})).subscribe(callback);
            publish('created', { id: 1 });
            publish('updated', { id: 1, dummy: 'test' });

            expect(callback).to.have.been.calledTwice;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.secondCall.args[0]).to.have.property('event', 'updated');
            expect(callback.secondCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.secondCall.args[0]).to.have.deep.property('record.dummy', 'test');
        });

        it('should marshal updated events into created events for newly matching records',
          function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects.find({ dummy: 'test' })).subscribe(callback);
            publish('created', { id: 1 });
            publish('updated', { id: 1, dummy: 'test' });

            expect(callback).to.have.been.calledOnce;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.firstCall.args[0]).to.have.deep.property('record.dummy', 'test');
        });

        it('should marshal updated events into destroyed events for newly non-matching records',
          function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects.find({ dummy: 'test' })).subscribe(callback);
            publish('created', { id: 1, dummy: 'test' });
            publish('updated', { id: 1, dummy: 'asdf' });

            expect(callback).to.have.been.calledTwice;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.firstCall.args[0]).to.have.deep.property('record.dummy', 'test');
            expect(callback.secondCall.args[0]).to.have.property('event', 'destroyed');
            expect(callback.secondCall.args[0]).to.have.deep.property('record.id', 1);
            expect(callback.secondCall.args[0]).to.have.deep.property('record.dummy', 'asdf');
        });

        it('should marshal the first updated event for a record into a created event', function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects.find({})).subscribe(callback);
            publish('updated', { id: 1 });

            expect(callback).to.have.been.calledOnce;
            expect(callback.firstCall.args[0]).to.have.property('event', 'created');
            expect(callback.firstCall.args[0]).to.have.deep.property('record.id', 1);
        });

        it('should filter out a destroyed event for a non-existent record', function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects.find({})).subscribe(callback);
            publish('destroyed', { id: 1 });

            expect(callback).to.not.have.been.called;
        });

        it('should filter out a created event for a non-matching query', function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects.findByIdentifier(2)).subscribe(callback);
            publish('created', { id: 1 });

            expect(callback).to.not.have.been.called;
        });

        it('should filter out an updated event for a non-matching query', function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects.findByIdentifier(2)).subscribe(callback);
            publish('created', { id: 1 });
            publish('updated', { id: 1 });

            expect(callback).to.not.have.been.called;
        });

        it('should filter out a destroyed event for a non-matching query', function () {
            var callback = sinon.spy();
            waterline.observe(waterline.testobjects.findByIdentifier(2)).subscribe(callback);
            publish('created', { id: 1 });
            publish('destroyed', { id: 1 });

            expect(callback).to.not.have.been.called;
        });
    });
});

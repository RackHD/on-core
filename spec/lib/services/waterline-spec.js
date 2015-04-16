// Copyright 2014, Renasar Technologies Inc.
/* jshint node:true */

'use strict';

describe('Services.Waterline', function () {
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

    helper.before(function () {
        return [
            helper.di.overrideInjection(waterlineProtocolFactory, 'Protocol.Waterline', ['Rx']),
            helper.di.overrideInjection(testModelFactory, 'Models.TestObject', ['Model'])
        ];
    });

    before("set up test dependencies", function() {
       waterline = helper.injector.get('Services.Waterline');
    });

    beforeEach(function () {
        return helper.reset();
    });

    helper.after();

    describe('start', function () {
        it('should resolve itself if already initialized', function() {
            return waterline.start();
        });

        it('should reject if an error occurs when it is not initialized', function() {
            waterline.initialized = false;
            return waterline.start().should.be.rejected;
        });
    });

    describe('observe()', function () {
        function publish(event, record) {
            var waterlineProtocol = helper.injector.get('Protocol.Waterline');
            expect(waterlineProtocol.observeCollection).to.have.been.calledOnce;
            var subject = waterlineProtocol.observeCollection.returnValues[0];
            subject.onNext({ event: event, record: record });
        }

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


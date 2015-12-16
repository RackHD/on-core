// Copyright 2016, EMC, Inc.

'use strict';

describe('Task/TaskGraph messenger factory', function () {
    var amqp = {};
    var configuration = {
        get: sinon.stub().withArgs('taskgraph-messenger').returns('AMQP')
    };

    before(function() {
        helper.setupInjector([
            helper.require('/lib/workflow/messengers/messenger'),
            helper.di.simpleWrapper(amqp, 'Task.Messengers.AMQP'),
            helper.di.simpleWrapper(configuration, 'Services.Configuration')
        ]);
    });

    it('should return the AMQP messenger plugin', function() {
        expect(helper.injector.get('Task.Messenger')).to.equal(amqp);
    });
});

// Copyright 2016, EMC, Inc.

'use strict';

describe('Task Graph Store factory', function () {
    var mongo = {};
    var configuration = {
        get: sinon.stub().withArgs('taskgraph-store').returns('mongo')
    };

    before(function() {
        helper.setupInjector([
            helper.require('/lib/workflow/stores/store'),
            helper.di.simpleWrapper(mongo, 'TaskGraph.Stores.Mongo'),
            helper.di.simpleWrapper(configuration, 'Services.Configuration')
        ]);
    });

    it('should return the mongo store plugin', function() {
        expect(helper.injector.get('TaskGraph.Store')).to.equal(mongo);
    });
});

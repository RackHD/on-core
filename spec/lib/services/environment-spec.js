// Copyright 2015, EMC, Inc.


'use strict';

describe('Services.Environment', function () {
    var waterline;

    helper.before();

    before(function () {
        this.subject = helper.injector.get('Services.Environment');
        waterline = helper.injector.get('Services.Waterline');
    });

    beforeEach('set up mocks', function() {
        this.sandbox.stub(waterline.environment, "findOne");
    });

    helper.after();

    var global = {
        identifier: 'global',
        data: {
            key1: {
                key2: 'key2-value',
                key3: 'key3-value'
            }
        }
    };

    var sku = {
        identifier: 'sku',
        data: {
            key1: {
                key2: 'sku-value'
            }
        }
    };

    it('should get a key-value', function() {
        waterline.environment.findOne.withArgs({identifier: 'global'}).resolves(global);
        return this.subject.get('key1.key2', 'value1').then(function(val) {
            val.should.equal('key2-value');
        });
    });

    it('should get the highest priority key-value', function() {
        waterline.environment.findOne.withArgs({identifier: 'global'}).resolves(global);
        waterline.environment.findOne.withArgs({identifier: 'sku'}).resolves(sku);
        return this.subject.get('key1.key2', 'value1', ['sku', 'global']).then(function(val) {
            val.should.equal('sku-value');
        });
    });

    it('should get the lower priority key-value when the high prioritiy is emtpy', function() {
        waterline.environment.findOne.withArgs({identifier: 'global'}).resolves(global);
        waterline.environment.findOne.withArgs({identifier: 'sku'}).resolves(sku);
        return this.subject.get('key1.key3', 'value1', ['sku', 'global']).then(function(val) {
            val.should.equal('key3-value');
        });
    });

    it('should merge priorities', function() {
        waterline.environment.findOne.withArgs({identifier: 'global'}).resolves(global);
        waterline.environment.findOne.withArgs({identifier: 'sku'}).resolves(sku);
        return this.subject.getAll(['sku', 'global'])
            .should.eventually.deep.equal(_.merge({}, global, sku).data);
    });
    
    it('should set a key-value', function() {
        var global = {};
        this.sandbox.stub(waterline.environment, "update", function(where, data) {
            global = data.data;
            return [global];
        });
        waterline.environment.update.withArgs({identifier: 'global'});
        return this.subject.set('key1.key2', 'value').then(function() {
            global.key1.key2.should.equal('value');
            waterline.environment.update.restore();
        });
    });
});

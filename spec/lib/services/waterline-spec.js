// Copyright (c) 2015, EMC Corporation


'use strict';

describe('Services.Waterline', function () {
    var waterline;

    helper.before();

    before(function() {
       waterline = helper.injector.get('Services.Waterline');
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
});


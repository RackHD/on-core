// Copyright 2015, EMC, Inc.

'use strict';

describe('Sanitizer', function () {
    var graphObj, sanitizer;
    helper.before();

    helper.after();

    before (function () {
        sanitizer = helper.injector.get('Sanitizer');

        graphObj = {};
        graphObj.id = 'testgraphid';
        graphObj._status = 'pending';
        graphObj.password = 'testPassword';
        graphObj.definition = {
            options: {
                test_task: {
                    password: "foo"
                }
            }
        };
    });

    it ('it removes passwords at  first level', function () {
        sanitizer.scrub(graphObj);
        expect(graphObj.password).to.not.equal('testPassword');
    });

    it ('it removes passwords at  nested levels', function () {
        sanitizer.scrub(graphObj);
        expect(graphObj.definition.options.test_task.password).to.not.equal('foo');
    });

});

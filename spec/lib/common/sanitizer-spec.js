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

    it ('it encrypts first level', function () {
        sanitizer.encrypt(graphObj);
        expect(graphObj.password).to.not.equal('testPassword');
    });

    it ('it encrypts nested levels', function () {
        sanitizer.encrypt(graphObj);
        expect(graphObj.definition.options.test_task.password).to.not.equal('foo');
    });

    it ('it decrypts as expected first level', function () {
        sanitizer.encrypt(graphObj);
        sanitizer.decrypt(graphObj);
        expect(graphObj.password).to.equal('testPassword');
    });

    it ('it decrypts as expected nested levels', function () {
        sanitizer.encrypt(graphObj);
        sanitizer.decrypt(graphObj);
        expect(graphObj.definition.options.test_task.password).to.equal('foo');
    });
});

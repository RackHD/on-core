"use strict";

var di = require('di'),
    _ = require('lodash'),
    core = require('..')(di),
    injector = new di.Injector(
            _.flatten([
                core.injectables,
                require('./dummyapp')
                ])
            ),
    logger = injector.get('Logger').initialize('DummyApp'),
    dummyApp = injector.get('DummyApp');

dummyApp.start()
    .catch(function(err) {
        logger.critical('Failure starting dummyAppy' + err.stack);
        process.nextTick(function(){
            process.exit(1);
        });
    });

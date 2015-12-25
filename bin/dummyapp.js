"use strict";

var di = require('di');
module.exports = Runner;
di.annotate(Runner, new di.Provide('DummyApp'));
di.annotate(Runner, new di.Inject(
            'Services.Core',
            'Services.Messenger',
            'Promise'
            )
        );

function Runner(core, messenger, Promise) {
    function start() {
        return core.start().
            then(function() {
            });
    }
    function stop() {
        return core.stop();
    }
    return {
        start: start,
        stop: stop
    };
}

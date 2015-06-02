// Copyright (c) 2015, EMC Corporation


'use strict';

var di = require('di');

module.exports = TimerFactory;

di.annotate(TimerFactory, new di.Provide('Timer'));
di.annotate(TimerFactory,
    new di.Inject(
    )
);

function TimerFactory () {
    /**
     * Wrapper for process.hrtime.
     * @constructor
     */
    function Timer () {
    }

    /**
     * Starts the timer.
     */
    Timer.prototype.start = function() {
        this.time = process.hrtime();
    };

    /**
     * Clears the timer.
     */
    Timer.prototype.clear = function() {
        this.time = undefined;
    };

    /**
     * Stops the timer and returns the difference in milliseconds.
     * @return {Number}
     */
    Timer.prototype.stop = function() {
        var diff = process.hrtime(this.time);

        return diff[0] + (diff[1] / 1000000);
    };

    return Timer;
}

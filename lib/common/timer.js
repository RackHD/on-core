// Copyright 2015, EMC, Inc.

'use strict';

module.exports = TimerFactory;

TimerFactory.$provide = 'Timer';

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
        //process.hrtime returns [<seconds>, <remaining nanoseconds>]
        return diff[0] + (diff[1] / 1000000000);
    };

    return Timer;
}

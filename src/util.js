/*eslint no-console: "off"*/

(function() {
    'use strict';

    var consts = require('./consts');

    function log() {
        var s = '';
        for (var i=0; i<arguments.length; i++) {
            s += '[' + arguments[i] + '] ';
        }
        console.log(s);
        return s;
    }

    function sign(i) {
        if (i < 0) {
            return -1;
        } else if (i > 0) {
            return +1;
        }
        return 0;
    }

    function clamp(i, imin, imax) {
        return Math.max(imin, Math.min(imax, i));
    }

    function range(start, end, step) {
        if (step === undefined) {
            step = 1;
        }
        if (end === undefined) {
            end = start;
            start = 0;
        }
        if (step === 0) {
            throw RangeError('0 step not allowed in range()');
        }

        if ((step>0 && start>end) || (step<0 && start<end)) {
            var t = start;
            start = end;
            end = t;
        }

        var rv=[];
        if (step > 0) {
            for (var gi=start; gi<end; gi+=step) {
                rv.push(gi);
            }
        } else {
            for (var li=start; li>end; li+=step) {
                rv.push(li);
            }
        }
        return rv;
    }

    // Given dx,dy, find the angle and snap it to one of the 8 directions.
    function snapAngle(dx, dy) {
        var angle = Math.atan2(dy, dx);
        if (angle < 0) {
            angle += Math.TAU;
        }
        // snap to 8 directions, 0=E, 1=SE, 2=S, 3=SW, etc.
        // TODO: hysteresis based on the direction you're dragging in
        var direction = (Math.floor(((angle-(Math.TAU/16)) / Math.TAU) * 8) + 1)%8;
        angle = direction * (Math.TAU/8);
        return [angle, direction];
    }

    function calcTweenTime(t) {
        if (!t) {
            t = 0;
        } else if (t === true) {
            t = consts.TWEEN_TIME;
        }
        return t;
    }

    module.exports = {
        log: log,
        sign: sign,
        clamp: clamp,
        range: range,
        snapAngle: snapAngle,
        calcTweenTime: calcTweenTime
    };

}());

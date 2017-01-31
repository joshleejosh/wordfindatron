/*eslint no-console: "off"*/

(function() {
    'use strict';

    var Random = require('random-js');
    var consts = require('./consts');

    function log() {
        var s = '';
        if (consts.VERBOSITY > 0) {
            for (var i=0; i<arguments.length; i++) {
                s += '[' + arguments[i] + '] ';
            }
            console.log(s);
        }
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
        if (imin > imax) {
            var t = imin;
            imin = imax;
            imax = t;
        }
        return Math.max(imin, Math.min(imax, i));
    }

    function scale(i, imin, imax, omin, omax) {
        if (imin === imax) {
            return omin;
        }
        return (((i - imin) / (imax - imin)) * (omax - omin)) + omin;
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

    // same as indexOf, but does a binary search.
    function bIndexOf(a, w) {
        var imin = 0,
            imax = a.length;
        while (imin < imax) {
            var i = Math.floor((imin + imax) / 2);
            var b = a[i];
            if (b > w) {
                imax = i;
            } else if (b < w) {
                imin = i + 1;
            } else {
                return i;
            }
        }
        return -1;
    }

    // Do a quick and dirty Fisher-Yates shuffle. For when the results don't need to be good, just ok
    function shuffle(rng, a) {
        for (var i=a.length-1; i>=1; i--) {
            var j = Random.integer(0, i)(rng);
            var t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
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

    module.exports = {
        log: log,
        sign: sign,
        scale: scale,
        clamp: clamp,
        range: range,
        bIndexOf: bIndexOf,
        shuffle: shuffle,
        snapAngle: snapAngle
    };

}());

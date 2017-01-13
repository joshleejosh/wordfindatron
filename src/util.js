(function () {
'use strict';
var consts = require('./consts');
    

// TODO: manual seeding
function rnd() {
    return Math.random();
}
// inclusive.
function rndint(min, max) {
    return Math.floor(min + rnd()*((max+1)-min));
}

function sign(i) {
    if (i < 0) {
        return -1;
    } else if (i > 0) {
        return +1;
    } else {
        return 0;
    }
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
        for (var i=start; i<end; i+=step) {
            rv.push(i);
        }
    } else {
        for (i=start; i>end; i+=step) {
            rv.push(i);
        }
    }
    return rv;
}

/*
 * Return tuple (x, y, dx, dy), where x,y is the starting location for the
 * slice on the grid and dx,dy is the increment to walk through the slice.
 *
 * direction … slice 0 starting point (G = grid size - 1)
 * 0 → E       top-left (0,0)
 * 1 ↘ SE      bottom-left (0,G)
 * 2 ↓ S       top-left  (0,0)
 * 3 ↙ SW      top-left (0,0)
 * 4 ← W       top-right (G,0)
 * 5 ↖ NW       bottom-left (0,G)
 * 6 ↑ N       bottom-left (0,G)
 * 7 ↗ NE      top-left (0,0)
 */
function sliceParams (sz, di, si) {
    var mg = sz - 1;
    if ((sz <= 0) || (si < 0) || (di%2 === 0 && si > mg) || (di%2 === 1 && si > (sz*2-2))) {
        throw RangeError('sliceParams: slice '+si+' out of range for grid size '+sz+'');
    }
    return [[0                       , si                      ,  1,  0],
            [Math.max(0, si-mg)      , Math.max(0, mg-si)      ,  1,  1],
            [si                      , 0                       ,  0,  1],
            [Math.min(mg, mg-(mg-si)), Math.max(0, si-mg)      , -1,  1],
            [mg                      , si                      , -1,  0],
            [Math.min(mg, mg-(mg-si)), Math.min(mg, mg-(si-mg)), -1, -1],
            [si                      , mg                      ,  0, -1],
            [Math.max(0, si-mg)      , Math.min(mg, mg-(mg-si)),  1, -1]
    ][di];
}

// Given dx,dy, find the angle and snap it to one of the 8 directions.
function snapAngle(dx, dy) {
    var angle = Math.atan2(dy, dx);
    if (angle < 0) {
        angle += Math.TAU;
    }
    // snap to 8 directions, 0=E, 1=SE, 2=S, 3=SW, etc.
    // TODO: hysteresis based on the direction you're dragging in
    var direction = (Math.floor(((angle-Math.TAU/16) / Math.TAU) * 8) + 1)%8;
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
    rnd:rnd,
    rndint:rndint,
    sign:sign,
    clamp:clamp,
    range:range,
    sliceParams:sliceParams,
    snapAngle:snapAngle,
    calcTweenTime:calcTweenTime
};

}());

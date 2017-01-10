
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
 * direction     slice 0 starting point (G = grid size - 1)
 * 0 → W to E    top-left (0,0)
 * 1 ↘ NW to SE  bottom-left (0,G)
 * 2 ↓ N to S    top-left  (0,0)
 * 3 ↙ NE to SW  top-left (0,0)
 * 4 ← E to W    top-right (G,0)
 * 5 ↖ SE to NW  bottom-left (0,G)
 * 6 ↑ S to N    bottom-left (0,G)
 * 7 ↗ SW to NE  top-left (0,0)
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

module.exports = {
    rnd:rnd,
    rndint:rndint,
    sign:sign,
    clamp:clamp,
    range:range,
    sliceParams:sliceParams
};


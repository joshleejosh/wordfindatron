var viewhelp = require('../src/viewhelp');

exports.TestViewhelp = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    },

    testSnapAngle: function(test) {
        var τ = Math.TAU;

        // axes
        test.deepEqual(viewhelp.snapAngle( 1,  0), [      0, 0]);
        test.deepEqual(viewhelp.snapAngle( 1,  1), [  (τ/8), 1]);
        test.deepEqual(viewhelp.snapAngle( 0,  1), [2*(τ/8), 2]);
        test.deepEqual(viewhelp.snapAngle(-1,  1), [3*(τ/8), 3]);
        test.deepEqual(viewhelp.snapAngle(-1,  0), [4*(τ/8), 4]);
        test.deepEqual(viewhelp.snapAngle(-1, -1), [5*(τ/8), 5]);
        test.deepEqual(viewhelp.snapAngle( 0, -1), [6*(τ/8), 6]);
        test.deepEqual(viewhelp.snapAngle( 1, -1), [7*(τ/8), 7]);

        // edges of octant boundaries on a circle of radius 10
        function check(a, r, d) {
            var p = [r * Math.cos(a), r * Math.sin(a)];
            test.deepEqual(viewhelp.snapAngle(p[0],p[1]), [d*(τ/8), d]);
        }
        function check3(i, a, b, c) {
            check(i*(τ/16)-0.001, 10, a);
            check(i*(τ/16)      , 10, b);
            check(i*(τ/16)+0.001, 10, c);
        }
        check3( 1, 0, 1, 1);
        check3( 3, 1, 2, 2);
        check3( 5, 2, 3, 3);
        check3( 7, 3, 4, 4);
        check3( 9, 4, 4, 5);
        check3(11, 5, 5, 6);
        check3(13, 6, 7, 7);
        check3(15, 7, 7, 0);

        test.done();
    }

};


const util = require('../src/util');

exports.TestUtil = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    },

    testRange: function(test) {
        // one arg
        test.deepEqual(util.range(0), []);
        test.deepEqual(util.range(1), [0]);
        test.deepEqual(util.range(5), [0,1,2,3,4]);

        // two args
        test.deepEqual(util.range(0,4), [0,1,2,3]);
        test.deepEqual(util.range(1,4), [1,2,3]);
        test.deepEqual(util.range(5,7), [5,6]);

        // positive step
        test.deepEqual(util.range(0,1,2), [0]);
        test.deepEqual(util.range(0,9,2), [0,2,4,6,8]);
        test.deepEqual(util.range(5, 15, 3), [5, 8, 11, 14]);

        // negative step
        test.deepEqual(util.range(7, 2, -1), [7, 6, 5, 4, 3]);
        test.deepEqual(util.range(7, 2, -2), [7, 5, 3]);
        test.deepEqual(util.range(15, -7, -3), [15, 12, 9, 6, 3, 0, -3, -6]);

        // bad step
        try {
            var a = util.range(2, 7, 0);
            test.fail('oops');
        } catch (re) {
            // pass
        }

        // start and end are the wrong way around
        // (note: python's range returns empty list in this case)
        test.deepEqual(util.range(7, 2, 2), [2, 4, 6]);
        test.deepEqual(util.range(2, 7, -2), [7, 5, 3]);

        test.done();
    },

    testSliceParams: function(test) {
        test.deepEqual(util.sliceParams(5, 0, 0), [0, 0,  1,  0]);
        test.deepEqual(util.sliceParams(5, 0, 4), [0, 4,  1,  0]);
        test.deepEqual(util.sliceParams(5, 1, 0), [0, 4,  1,  1]);
        test.deepEqual(util.sliceParams(5, 1, 4), [0, 0,  1,  1]);
        test.deepEqual(util.sliceParams(5, 1, 8), [4, 0,  1,  1]);
        test.deepEqual(util.sliceParams(5, 2, 0), [0, 0,  0,  1]);
        test.deepEqual(util.sliceParams(5, 2, 4), [4, 0,  0,  1]);
        test.deepEqual(util.sliceParams(5, 3, 0), [0, 0, -1,  1]);
        test.deepEqual(util.sliceParams(5, 3, 4), [4, 0, -1,  1]);
        test.deepEqual(util.sliceParams(5, 3, 8), [4, 4, -1,  1]);
        test.deepEqual(util.sliceParams(5, 4, 0), [4, 0, -1,  0]);
        test.deepEqual(util.sliceParams(5, 4, 4), [4, 4, -1,  0]);
        test.deepEqual(util.sliceParams(5, 5, 0), [0, 4, -1, -1]);
        test.deepEqual(util.sliceParams(5, 5, 4), [4, 4, -1, -1]);
        test.deepEqual(util.sliceParams(5, 5, 8), [4, 0, -1, -1]);
        test.deepEqual(util.sliceParams(5, 6, 0), [0, 4,  0, -1]);
        test.deepEqual(util.sliceParams(5, 6, 4), [4, 4,  0, -1]);
        test.deepEqual(util.sliceParams(5, 7, 0), [0, 0,  1, -1]);
        test.deepEqual(util.sliceParams(5, 7, 4), [0, 4,  1, -1]);
        test.deepEqual(util.sliceParams(5, 7, 8), [4, 4,  1, -1]);

        // spot check for other grid sizes.
        test.deepEqual(util.sliceParams(1, 4, 0),  [0,  0, -1,  0]);
        test.deepEqual(util.sliceParams(2, 7, 2),  [1,  1,  1, -1]);
        test.deepEqual(util.sliceParams(3, 6, 1),  [1,  2,  0, -1]);
        test.deepEqual(util.sliceParams(7, 3, 9),  [6,  3, -1,  1]);
        test.deepEqual(util.sliceParams(11, 5, 6), [6, 10, -1, -1]);

        // slices out of bounds
        try {
            test.deepEqual(util.sliceParams(5, 0, 5), []);
            test.fail('oops');
        } catch (re) { }
        try {
            test.deepEqual(util.sliceParams(5, 0, -1), []);
            test.fail('oops');
        } catch (re) { }
        try {
            test.deepEqual(util.sliceParams(5, 1, 9), []);
            test.fail('oops');
        } catch (re) { }
        try {
            test.deepEqual(util.sliceParams(5, 1, -1), []);
            test.fail('oops');
        } catch (re) { }
        // bad grid size
        try {
            test.deepEqual(util.sliceParams(0, 1, 3), []);
            test.fail('oops');
        } catch (re) { }

        test.done();
    }

}

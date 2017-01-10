grid = require('../src/grid')

exports.TestGrid = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    },

    testEmpty: function(test) {
        var g = new grid.Grid(3);
        test.equal(g.size, 3);
        test.deepEqual(g.grid, [[' ',' ',' '],[' ',' ',' '],[' ',' ',' ']]);
        test.equal(g.toString(), '   \n   \n   \n');
        test.done();
    },

    testFromString: function(test) {
        // excess Xs should be ignored.
        var g = new grid.Grid(3).fromString('FHPIZNMW3XXXX');
        test.equal(g.toString(), 'FHP\nIZN\nMW3\n');
        var g = new grid.Grid(3).fromString('QRSTUVW');
        test.equal(g.toString(), 'QRS\nTUV\nW  \n');
        test.done();
    },

    testCopy: function(test) {
        var g = new grid.Grid(3).fromString('ABCDEFGHI');
        var h = g.copy();
        test.notStrictEqual(g, h);
        test.equal(g.size, h.size);
        test.deepEqual(g.grid, h.grid);
        test.done();
    },

    testCutSlice: function(test) {
        /*
        ABCDE
        FGHIJ
        KLMNO
        PQRST
        UVWXY
        */
        var g = new grid.Grid(5).fromString('ABCDEFGHIJKLMNOPQRSTUVWXY');
        test.deepEqual(g.cutSlice(0, 0), 'ABCDE');
        test.deepEqual(g.cutSlice(0, 4), 'UVWXY');
        test.deepEqual(g.cutSlice(1, 0), 'U');
        test.deepEqual(g.cutSlice(1, 4), 'AGMSY');
        test.deepEqual(g.cutSlice(1, 8), 'E');
        test.deepEqual(g.cutSlice(2, 0), 'AFKPU');
        test.deepEqual(g.cutSlice(2, 4), 'EJOTY');
        test.deepEqual(g.cutSlice(3, 0), 'A');
        test.deepEqual(g.cutSlice(3, 4), 'EIMQU');
        test.deepEqual(g.cutSlice(3, 8), 'Y');
        test.deepEqual(g.cutSlice(4, 0), 'EDCBA');
        test.deepEqual(g.cutSlice(4, 4), 'YXWVU');
        test.deepEqual(g.cutSlice(5, 0), 'U');
        test.deepEqual(g.cutSlice(5, 4), 'YSMGA');
        test.deepEqual(g.cutSlice(5, 8), 'E');
        test.deepEqual(g.cutSlice(6, 0), 'UPKFA');
        test.deepEqual(g.cutSlice(6, 4), 'YTOJE');
        test.deepEqual(g.cutSlice(7, 0), 'A');
        test.deepEqual(g.cutSlice(7, 4), 'UQMIE');
        test.deepEqual(g.cutSlice(7, 8), 'Y');
        test.done();
    },

    testFillSlice: function(test) {
        var g = new grid.Grid(6).fromString('  A   B    C     D      E       F   ');
        g.fillSlice(0, 2, 2, 'HI');
        g.fillSlice(2, 4, 3, 'TOOMANY'); // runs off the end after TOO
        g.fillSlice(5, 8, 0, 'OHM'); // overwrites D
        g.fillSlice(7, 5, 0, '123456');
        test.equal(g.toString(), '  AM 6\nB   5C\n  H4 O\n  3 T \nE2  O \n1 F O \n');
        g.fillSlice(6, 1, 3, 'éñ🄰'); // omg long unicode
        test.equal(g.toString(), ' 🄰AM 6\nBñ  5C\n éH4 O\n  3 T \nE2  O \n1 F O \n');
        test.done();
    },

}


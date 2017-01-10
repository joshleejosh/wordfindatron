var grid = require('../src/grid');

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
        g = new grid.Grid(3).fromString('QRSTUVW');
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

    testPlaceWord: function(test) {
        var g = new grid.Grid(6).fromString('  A   B    C     D      E       F   ');
        g.placeWord(0, 2, 2, 'HI');
        g.placeWord(2, 4, 3, 'TOOMANY'); // runs off the end after TOO
        g.placeWord(5, 8, 0, 'OHM'); // overwrites D
        g.placeWord(7, 5, 0, '123456');
        test.equal(g.toString(), '  AM 6\nB   5C\n  H4 O\n  3 T \nE2  O \n1 F O \n');
        g.placeWord(6, 1, 3, 'éñ🄰'); // omg long unicode
        test.equal(g.toString(), ' 🄰AM 6\nBñ  5C\n éH4 O\n  3 T \nE2  O \n1 F O \n');
        test.done();
    },

    testReadWord: function(test) {
        var g = new grid.Grid(5).fromString('ABCDEFGHIJKLMNOPQRSTUVWXY');
        test.equal(g.readWord(0, 3, 2, 2), 'RS');
        test.equal(g.readWord(0, 3, 2, 4), 'RST'); // word length results in overrun
        test.equal(g.readWord(1, 5, 0, 3), 'BHN');
        test.equal(g.readWord(2, 0, 1, 4), 'FKPU');
        test.equal(g.readWord(3, 4, 1, 3), 'IMQ');
        test.equal(g.readWord(4, 2, 4, 1), 'K');
        test.equal(g.readWord(4, 2, -1, 1), ''); // bad offset
        test.equal(g.readWord(5, 6, 1, 2), 'IC');
        test.equal(g.readWord(6, 1, 3, 2), 'GB');
        test.equal(g.readWord(7, 0, 0, 0), '');
        test.equal(g.readWord(7, 0, 0, 1), 'A');
        try {
            test.equal(g.readWord(7, -1, 0, 1), '?'); // bad slice
            test.fail('oops');
        } catch (e) { }
        try {
            test.equal(g.readWord(7, 9, 0, 1), '?'); // bad slice
            test.fail('oops');
        } catch (e) { }
        try {
            test.equal(g.readWord(-1, 5, 1, 2), '?'); // bad direction
            test.fail('oops');
        } catch (e) { }
        try {
            test.equal(g.readWord(8, 5, 1, 2), '?'); // bad direction
            test.fail('oops');
        } catch (e) { }
        test.done();
    },

    testCoordsToSlice: function(test) {
        /*
        ABCDE
        FGHIJ
        KLMNO
        PQRST
        UVWXY
        */
        var g = new grid.Grid(5).fromString('ABCDEFGHIJKLMNOPQRSTUVWXY');
        test.deepEqual(g.coordsToSlice(0,0,4,0), [0, 0, 0, 5]);

        test.deepEqual(g.coordsToSlice(0,3,1,4), [1, 1, 0, 2]);
        test.deepEqual(g.coordsToSlice(1,2,3,4), [1, 3, 1, 3]);
        test.deepEqual(g.coordsToSlice(1,1,3,3), [1, 4, 1, 3]);
        test.deepEqual(g.coordsToSlice(2,1,3,2), [1, 5, 1, 2]);

        test.deepEqual(g.coordsToSlice(2,3,2,4), [2, 2, 3, 2]);

        test.deepEqual(g.coordsToSlice(2,0,1,1), [3, 2, 0, 2]);
        test.deepEqual(g.coordsToSlice(3,1,0,4), [3, 4, 1, 4]);
        test.deepEqual(g.coordsToSlice(4,2,2,4), [3, 6, 0, 3]);

        test.deepEqual(g.coordsToSlice(3,4,0,4), [4, 4, 1, 4]);

        test.deepEqual(g.coordsToSlice(1,2,0,1), [5, 3, 2, 2]);
        test.deepEqual(g.coordsToSlice(4,4,0,0), [5, 4, 0, 5]);
        test.deepEqual(g.coordsToSlice(4,1,3,0), [5, 7, 0, 2]);

        test.deepEqual(g.coordsToSlice(1,4,1,0), [6, 1, 0, 5]);

        test.deepEqual(g.coordsToSlice(0,1,1,0), [7, 1, 0, 2]);
        test.deepEqual(g.coordsToSlice(2,2,4,0), [7, 4, 2, 3]);
        test.deepEqual(g.coordsToSlice(3,3,4,2), [7, 6, 1, 2]);
        test.deepEqual(g.coordsToSlice(3,4,4,3), [7, 7, 0, 2]);

        try {
            test.deepEqual(g.coordsToSlice(2,3,2,3), [0, 0, 0, 1]); // single point
            test.fail('oops');
        } catch (e) { }
        try {
            test.deepEqual(g.coordsToSlice(2,3,3,5), [0, 0, 0, 1]); // off line
            test.fail('oops');
        } catch (e) { }
        test.done();
    }

};

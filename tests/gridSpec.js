describe('Test Grid', function(){
    var grid = require('../src/model/grid');

    describe('new Grid', function() {
        it('is filled with spaces', function() {
            var g = new grid.Grid(3);
            expect(g.size).toBe(3);
            expect(g.grid).toEqual([[' ',' ',' '],[' ',' ',' '],[' ',' ',' ']]);
            expect(g.toString()).toBe('   \n   \n   \n');
        });
    });

    describe('fromString()', function() {
        it('ignores excess characters', function() {
            var g = new grid.Grid(3).fromString('FHPIZNMW3XXXX');
            expect(g.toString()).toBe('FHP\nIZN\nMW3\n');
        });

        it('leaves spaces when not enough characters are given', function() {
            g = new grid.Grid(3).fromString('QRSTUVW');
            expect(g.toString()).toBe('QRS\nTUV\nW  \n');
        });
    });

    describe('copy()', function() {
        it('makes a deep duplicate of the grid', function() {
            var g = new grid.Grid(3).fromString('ABCDEFGHI');
            var h = g.copy();
            expect(g).not.toBe(h);
            expect(g).toEqual(h); // deep equal
        });
    });

    describe('cutSlice()', function() {
        it('cuts a rack of letters out of the grid along a direction+slice', function(){
            var g = new grid.Grid(5).fromString('ABCDEFGHIJKLMNOPQRSTUVWXY');
            expect(g.cutSlice(0, 0)).toBe('ABCDE');
            expect(g.cutSlice(0, 4)).toBe('UVWXY');
            expect(g.cutSlice(1, 0)).toBe('U');
            expect(g.cutSlice(1, 4)).toBe('AGMSY');
            expect(g.cutSlice(1, 8)).toBe('E');
            expect(g.cutSlice(2, 0)).toBe('AFKPU');
            expect(g.cutSlice(2, 4)).toBe('EJOTY');
            expect(g.cutSlice(3, 0)).toBe('A');
            expect(g.cutSlice(3, 4)).toBe('EIMQU');
            expect(g.cutSlice(3, 8)).toBe('Y');
            expect(g.cutSlice(4, 0)).toBe('EDCBA');
            expect(g.cutSlice(4, 4)).toBe('YXWVU');
            expect(g.cutSlice(5, 0)).toBe('U');
            expect(g.cutSlice(5, 4)).toBe('YSMGA');
            expect(g.cutSlice(5, 8)).toBe('E');
            expect(g.cutSlice(6, 0)).toBe('UPKFA');
            expect(g.cutSlice(6, 4)).toBe('YTOJE');
            expect(g.cutSlice(7, 0)).toBe('A');
            expect(g.cutSlice(7, 4)).toBe('UQMIE');
            expect(g.cutSlice(7, 8)).toBe('Y');
        });
    });

    describe('placeWord', function() {
        it('can place a word onto the grid at a direction+slice+offset', function() {
            var g = new grid.Grid(6).fromString('  A   B    C     D      E       F   ');
            g.placeWord(0, 2, 2, 'HI');
            g.placeWord(2, 4, 3, 'TOOMANY'); // runs off the end after TOO
            g.placeWord(5, 8, 0, 'OHM'); // overwrites D
            g.placeWord(7, 5, 0, '123456');
            expect(g.toString()).toBe('  AM 6\nB   5C\n  H4 O\n  3 T \nE2  O \n1 F O \n');
            g.placeWord(6, 1, 3, 'éñ🄰'); // omg long unicode
            expect(g.toString()).toBe(' 🄰AM 6\nBñ  5C\n éH4 O\n  3 T \nE2  O \n1 F O \n');
        });

        it('can place a GridWord onto the grid', function() {
            var g = new grid.Grid(6).fromString('  A   B    C     D      E       F   ');
            g.placeWord(new grid.GridWord(6, 'HI', 0, 2, 2));
            g.placeWord(new grid.GridWord(6, 'TOOMANY', 2, 4, 3)); // runs off the end after TOO
            g.placeWord(new grid.GridWord(6, 'OHM', 5, 8, 0)); // overwrites D
            g.placeWord(new grid.GridWord(6, '123456', 7, 5, 0));
            expect(g.toString()).toBe('  AM 6\nB   5C\n  H4 O\n  3 T \nE2  O \n1 F O \n');
            g.placeWord(new grid.GridWord(6, 'éñ🄰', 6, 1, 3)); // omg long unicode
            expect(g.toString()).toBe(' 🄰AM 6\nBñ  5C\n éH4 O\n  3 T \nE2  O \n1 F O \n');
        });
    });

    describe('readWord', function() {
        it('gets text out of the grid along the given slice', function() {
            var g = new grid.Grid(5).fromString('ABCDEFGHIJKLMNOPQRSTUVWXY');
            expect(g.readWord(0, 3, 2, 2)).toBe('RS');
            expect(g.readWord(0, 3, 2, 4)).toBe('RST'); // word length results in overrun
            expect(g.readWord(1, 5, 0, 3)).toBe('BHN');
            expect(g.readWord(2, 0, 1, 4)).toBe('FKPU');
            expect(g.readWord(3, 4, 1, 3)).toBe('IMQ');
            expect(g.readWord(4, 2, 4, 1)).toBe('K');
            expect(g.readWord(4, 2,-1, 1)).toBe(''); // bad offset
            expect(g.readWord(5, 6, 1, 2)).toBe('IC');
            expect(g.readWord(6, 1, 3, 2)).toBe('GB');
            expect(g.readWord(7, 0, 0, 0)).toBe('');
            expect(g.readWord(7, 0, 0, 1)).toBe('A');
        });

        it('rejects bad args', function() {
            try {
                expect(g.readWord(7, -1, 0, 1)).toBe('?'); // bad slice
                fail('oops');
            } catch (e) { }
            try {
                expect(g.readWord(7, 9, 0, 1)).toBe('?'); // bad slice
                fail('oops');
            } catch (e) { }
            try {
                expect(g.readWord(-1, 5, 1, 2)).toBe('?'); // bad direction
                fail('oops');
            } catch (e) { }
            try {
                expect(g.readWord(8, 5, 1, 2)).toBe('?'); // bad direction
                fail('oops');
            } catch (e) { }
        });
    });

    describe('coordsToSlice', function() {
        it('converts two xy locations to a slice', function() {
            /*
             * ABCDE
             * FGHIJ
             * KLMNO
             * PQRST
             * UVWXY
             */
            var g = new grid.Grid(5).fromString('ABCDEFGHIJKLMNOPQRSTUVWXY');
            expect(g.coordsToSlice(0,0,4,0)).toEqual([0, 0, 0, 5]);

            expect(g.coordsToSlice(0,3,1,4)).toEqual([1, 1, 0, 2]);
            expect(g.coordsToSlice(1,2,3,4)).toEqual([1, 3, 1, 3]);
            expect(g.coordsToSlice(1,1,3,3)).toEqual([1, 4, 1, 3]);
            expect(g.coordsToSlice(2,1,3,2)).toEqual([1, 5, 1, 2]);

            expect(g.coordsToSlice(2,3,2,4)).toEqual([2, 2, 3, 2]);

            expect(g.coordsToSlice(2,0,1,1)).toEqual([3, 2, 0, 2]);
            expect(g.coordsToSlice(3,1,0,4)).toEqual([3, 4, 1, 4]);
            expect(g.coordsToSlice(4,2,2,4)).toEqual([3, 6, 0, 3]);

            expect(g.coordsToSlice(3,4,0,4)).toEqual([4, 4, 1, 4]);

            expect(g.coordsToSlice(1,2,0,1)).toEqual([5, 3, 2, 2]);
            expect(g.coordsToSlice(4,4,0,0)).toEqual([5, 4, 0, 5]);
            expect(g.coordsToSlice(4,1,3,0)).toEqual([5, 7, 0, 2]);

            expect(g.coordsToSlice(1,4,1,0)).toEqual([6, 1, 0, 5]);

            expect(g.coordsToSlice(0,1,1,0)).toEqual([7, 1, 0, 2]);
            expect(g.coordsToSlice(2,2,4,0)).toEqual([7, 4, 2, 3]);
            expect(g.coordsToSlice(3,3,4,2)).toEqual([7, 6, 1, 2]);
            expect(g.coordsToSlice(3,4,4,3)).toEqual([7, 7, 0, 2]);
        });

        it('rejects bad args', function() {
            try {
                expect(g.coordsToSlice(2,3,2,3)).toEqual([0, 0, 0, 1]); // single point
                fail('oops');
            } catch (e) { }
            try {
                expect(g.coordsToSlice(2,3,3,5)).toEqual([0, 0, 0, 1]); // off line
                fail('oops');
            } catch (e) { }
        });
    });

    describe('sliceParams()', function() {
        it('calculates starting position and deltas for a direction and slice', function(){
            expect(grid.sliceParams(5, 0, 0)).toEqual([0, 0,  1,  0]);
            expect(grid.sliceParams(5, 0, 4)).toEqual([0, 4,  1,  0]);
            expect(grid.sliceParams(5, 1, 0)).toEqual([0, 4,  1,  1]);
            expect(grid.sliceParams(5, 1, 4)).toEqual([0, 0,  1,  1]);
            expect(grid.sliceParams(5, 1, 8)).toEqual([4, 0,  1,  1]);
            expect(grid.sliceParams(5, 2, 0)).toEqual([0, 0,  0,  1]);
            expect(grid.sliceParams(5, 2, 4)).toEqual([4, 0,  0,  1]);
            expect(grid.sliceParams(5, 3, 0)).toEqual([0, 0, -1,  1]);
            expect(grid.sliceParams(5, 3, 4)).toEqual([4, 0, -1,  1]);
            expect(grid.sliceParams(5, 3, 8)).toEqual([4, 4, -1,  1]);
            expect(grid.sliceParams(5, 4, 0)).toEqual([4, 0, -1,  0]);
            expect(grid.sliceParams(5, 4, 4)).toEqual([4, 4, -1,  0]);
            expect(grid.sliceParams(5, 5, 0)).toEqual([0, 4, -1, -1]);
            expect(grid.sliceParams(5, 5, 4)).toEqual([4, 4, -1, -1]);
            expect(grid.sliceParams(5, 5, 8)).toEqual([4, 0, -1, -1]);
            expect(grid.sliceParams(5, 6, 0)).toEqual([0, 4,  0, -1]);
            expect(grid.sliceParams(5, 6, 4)).toEqual([4, 4,  0, -1]);
            expect(grid.sliceParams(5, 7, 0)).toEqual([0, 0,  1, -1]);
            expect(grid.sliceParams(5, 7, 4)).toEqual([0, 4,  1, -1]);
            expect(grid.sliceParams(5, 7, 8)).toEqual([4, 4,  1, -1]);

            // spot check for other grid sizes.
            expect(grid.sliceParams( 1, 4, 0)).toEqual([0,  0, -1,  0]);
            expect(grid.sliceParams( 2, 7, 2)).toEqual([1,  1,  1, -1]);
            expect(grid.sliceParams( 3, 6, 1)).toEqual([1,  2,  0, -1]);
            expect(grid.sliceParams( 7, 3, 9)).toEqual([6,  3, -1,  1]);
            expect(grid.sliceParams(11, 5, 6)).toEqual([6, 10, -1, -1]);
        });

        it('fails on bad arguments', function(){
            try {
                expect(grid.sliceParams(5, 0, 5)).toEqual([]);
                fail('oops');
            } catch (re) { }
            try {
                expect(grid.sliceParams(5, 0, -1)).toEqual([]);
                fail('oops');
            } catch (re) { }
            try {
                expect(grid.sliceParams(5, 1, 9)).toEqual([]);
                fail('oops');
            } catch (re) { }
            try {
                expect(grid.sliceParams(5, 1, -1)).toEqual([]);
                fail('oops');
            } catch (re) { }
            // bad grid size
            try {
                expect(grid.sliceParams(0, 1, 3)).toEqual([]);
                fail('oops');
            } catch (re) { }
        });
    });

});

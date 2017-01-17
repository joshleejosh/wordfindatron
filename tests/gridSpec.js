describe('Test Grid', function(){
    var grid = require('../src/model/grid');

    describe('new Grid', function() {
        it('is filled with spaces', function() {
            var g = new grid.Grid(3);
            expect(g.size).toBe(3);
            expect(g.toString()).toBe('   \n   \n   \n');
        });
    });

    describe('get/set', function() {
        it('gets a cell\'s value', function() {
            var g = new grid.Grid(4).fromString('ABCDEFGHIJKLMNOP');
            expect(g.get(0, 0)).toBe('A');
            expect(g.get(1, 0)).toBe('B');
            expect(g.get(2, 0)).toBe('C');
            expect(g.get(3, 0)).toBe('D');
            expect(g.get(0, 1)).toBe('E');
            expect(g.get(1, 1)).toBe('F');
            expect(g.get(2, 1)).toBe('G');
            expect(g.get(3, 1)).toBe('H');
            expect(g.get(0, 2)).toBe('I');
            expect(g.get(1, 2)).toBe('J');
            expect(g.get(2, 2)).toBe('K');
            expect(g.get(3, 2)).toBe('L');
            expect(g.get(0, 3)).toBe('M');
            expect(g.get(1, 3)).toBe('N');
            expect(g.get(2, 3)).toBe('O');
            expect(g.get(3, 3)).toBe('P');
        });

        it('sets a cell\'s value', function() {
            var g = new grid.Grid(4);
            g.set(0, 0, 'A');
            g.set(1, 0, 'B');
            g.set(2, 0, 'C');
            g.set(3, 0, 'D');
            g.set(0, 1, 'E');
            g.set(1, 1, 'F');
            g.set(2, 1, 'G');
            g.set(3, 1, 'H');
            g.set(0, 2, 'I');
            g.set(1, 2, 'J');
            g.set(2, 2, 'K');
            g.set(3, 2, 'L');
            g.set(0, 3, 'M');
            g.set(1, 3, 'N');
            g.set(2, 3, 'O');
            g.set(3, 3, 'P');
            expect(g.toString()).toBe('ABCD\nEFGH\nIJKL\nMNOP\n');
        });

        it('get rejects bad indices', function() {
            var g = new grid.Grid(4).fromString('ABCDEFGHIJKLMNOP');
            expect(()=>{ return g.get(-1, 0); }).toThrowError(RangeError);
            expect(()=>{ return g.get(0, -1); }).toThrowError(RangeError);
            expect(()=>{ return g.get(4, 0); }).toThrowError(RangeError);
            expect(()=>{ return g.get(0, 4); }).toThrowError(RangeError);
        });

        it('set rejects bad indices', function() {
            var g = new grid.Grid(4).fromString('ABCDEFGHIJKLMNOP');
            expect(()=>{ g.set(-1, 0, 'Q'); }).toThrowError(RangeError);
            expect(()=>{ g.set(0, -1, 'Q'); }).toThrowError(RangeError);
            expect(()=>{ g.set(4,  0, 'Q'); }).toThrowError(RangeError);
            expect(()=>{ g.set(0,  4, 'Q'); }).toThrowError(RangeError);
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
            // bad slice
            expect(()=>{ return g.readWord( 7,-1, 0, 1); }).toThrowError();
            expect(()=>{ return g.readWord( 7, 9, 0, 1); }).toThrowError();
            // bad direction
            expect(()=>{ return g.readWord(-1, 5, 1, 2); }).toThrowError();
            expect(()=>{ return g.readWord( 8, 5, 1, 2); }).toThrowError();
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
            // off line
            expect(()=>{ return g.coordsToSlice(2,3,2,3); }).toThrowError(RangeError);
            expect(()=>{ return g.coordsToSlice(2,3,3,5); }).toThrowError(RangeError);
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
            expect(()=>{ return grid.sliceParams(5, 0, 5); }).toThrowError(RangeError);
            expect(()=>{ return grid.sliceParams(5, 0,-1); }).toThrowError(RangeError);
            expect(()=>{ return grid.sliceParams(5, 1, 9); }).toThrowError(RangeError);
            expect(()=>{ return grid.sliceParams(5, 1,-1); }).toThrowError(RangeError);
            // bad grid size
            expect(()=>{ return grid.sliceParams(0, 1, 3); }).toThrowError(RangeError);
        });
    });

    describe('GridWord.getCellCoordinates()', function() {
        it('returns a list of x/y pairs for each cell in this word', function() {
            expect(new grid.GridWord(5, 'FOO', 1, 3, 1).getCellCoordinates())
                .toEqual([ {x:1,y:2}, {x:2,y:3}, {x:3,y:4} ]);
        });
        it('does NOT halt if the GridWord runs off the end of the grid', function() {
            expect(new grid.GridWord(7, 'GRONKY', 5, 8, 1).getCellCoordinates())
                .toEqual([ {x:5,y:3}, {x:4,y:2}, {x:3,y:1}, {x:2,y:0}, {x:1,y:-1}, {x:0,y:-2} ]);
        });
    });
});

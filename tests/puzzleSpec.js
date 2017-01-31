describe('Test Puzzle', function(){
    var data = require('../src/model/data');
    var grid = require('../src/model/grid');
    var puzzle = require('../src/model/puzzle');
    var conflictscan = require('../src/model/conflictscan');
    var puzgen = require('../src/model/puzgen');

    describe('construct', function() {
        it('defaults with no args', function() {
            var puz = new puzzle.Puzzle();
            expect(puz.seed).toBeCloseTo(new Date().getTime(), -1); // within milliseconds of the date seed
            expect(puz.size).toBe(8);
            expect(puz.grid).toEqual(new grid.Grid(8));
            expect(puz.answers).toEqual([]);
        });

        it('takes a size', function() {
            var puz = new puzzle.Puzzle(31);
            expect(puz.size).toBe(31);
            expect(()=>{ return new puzzle.Puzzle(-1); }).toThrowError(RangeError);
        });

        it('takes a seed', function() {
            var puz = new puzzle.Puzzle(7, -215423);
            expect(puz.seed).toBe(-215423);
            // 0 seed is replaced with time
            puz = new puzzle.Puzzle(7, 0);
            expect(puz.seed).toBeCloseTo(new Date().getTime(), -1);
            // reject seeds of the wrong type
            expect(()=>{ return new puzzle.Puzzle(7, 'badarg'); }).toThrowError(TypeError);
            // coerce/default other bad seeds
            puz = new puzzle.Puzzle(7, 44/'NaN');
            expect(puz.seed).toBeCloseTo(new Date().getTime(), -1);
            puz = new puzzle.Puzzle(7, null);
            expect(puz.seed).toBeCloseTo(new Date().getTime(), -1);
        });
    });

    describe('reset()', function() {
        it('blanks out the puzzle\'s answers and grid', function() {
            var puz = new puzzle.Puzzle(6, 1);
            var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJ');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));
            expect(puz.size).toBe(6);
            expect(puz.seed).toBe(1);
            expect(puz.grid.toString()).toBe('ABCDEF\nGHIJKL\nMNOPQR\nSTUVWX\nYZABCD\nEFGHIJ\n');
            expect(puz.answers.length).toBe(4);
            expect(puz.words.length).toBe(4);

            puz.reset();
            expect(puz.size).toBe(6);
            expect(puz.seed).toBe(1);
            expect(puz.grid.toString()).toBe('      \n      \n      \n      \n      \n      \n');
            expect(puz.answers.length).toBe(0);
            expect(puz.words.length).toBe(0);
            puz.reset(1234);
            expect(puz.seed).toBe(1234);
        });
    });

    describe('copy()', function()  {
        it('makes a deep copy of the puzzle\'s grid and answers', function() {
            var puz = new puzzle.Puzzle(6, 1);
            var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJ');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));

            var quz = puz.copy();
            expect(quz).not.toBe(puz);
            expect(quz.size).toEqual(puz.size);
            expect(quz.seed).toEqual(puz.seed);
            expect(quz.grid).not.toBe(puz.grid);
            expect(quz.grid).toEqual(puz.grid);
            for (var i=0; i<4; i++) {
                expect(quz.answers[i]).not.toBe(puz.answers[i]);
                expect(quz.answers[i]).toEqual(puz.answers[i]);
            }
        });
    });

    describe('answerGrid()', function() {
        it('produces a grid with no fill, just answers', function() {
            var puz = new puzzle.Puzzle(6, 1);
            var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));
            var h = puz.answerGrid();
            expect(h.toString()).toBe('      \nG     \n NO   \n  U W \n   1  \n456 8 \n');
        });
    });

    describe('containsWord()', function() {
        it('checks to see if the word is one of the puzzle\'s answers', function() {
            var puz = new puzzle.Puzzle(6, 54321);
            var g = new grid.Grid(6).fromString('ABCDEFKHIJKLMNOPQRSTUVWXYZABCDEFGHIJ');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));

            expect(puz.containsWord('WBG')).toBe(true);
            expect(puz.containsWord('UO')).toBe(true);
            expect(puz.containsWord('KNUBI')).toBe(true);
            expect(puz.containsWord('GFE')).toBe(true);
            expect(puz.containsWord('GFF')).not.toBe(true);
            expect(puz.containsWord('VBI')).not.toBe(true);
        });
        it('checks to see if the word is a substring of an answer (or vice versa)', function() {
            var puz = new puzzle.Puzzle(6, 54321);
            var g = new grid.Grid(6).fromString('ABCDEFKHIJKLMNOPQRSTUVWXYZABCDEFGHIJ');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));

            expect(puz.containsWord('WBG')).toBe(true);
            expect(puz.containsWord('UO')).toBe(true);
            expect(puz.containsWord('FUOR')).toBe(true);

            expect(puz.containsWord('GFE')).toBe(true);
            expect(puz.containsWord('GF')).toBe(true);

            expect(puz.containsWord('KNUBI')).toBe(true);
            expect(puz.containsWord('NUB')).toBe(true);
            expect(puz.containsWord('GFF')).not.toBe(true);
        });
    });

    describe('density()', function() {
        it('= number of used letters / total letters', function() {
            var puz = new puzzle.Puzzle(6, 54321);
            var g = new grid.Grid(6).fromString('ABCDEFKHIJKLMNOPQRSTUVWXYZABCDEFGHIJ');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));
            var a = puz.answerGrid();
            var nonblank = a.toString().replace(/\s/g, '');
            expect(nonblank.length).toBe(10);
            expect(puz.density()).toBe(10/36);
        });
    });

    describe('serialize()', function() {
        beforeEach(function(done) {
            data.load(null, function() {
                done();
            });
        });

        it('outputs a string that deserialize() can read', function(done) {
            var puz = new puzzle.Puzzle(6, Number.MAX_SAFE_INTEGER);
            var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJ');
            puz.setGrid(g);
            /*
             * ABCDEF
             * GHJIKL
             * MNOPQR
             * STUVWX
             * YZABCD
             * EFGHIJ
             */

            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));
            expect(puz.answers[0]).toMatchGridWord(3, 7, 1, 'WBG',   4, 3, 2, 5);
            expect(puz.answers[1]).toMatchGridWord(6, 2, 2, 'UO',    2, 3, 2, 2);
            expect(puz.answers[2]).toMatchGridWord(1, 4, 0, 'GNUBI', 0, 1, 4, 5);
            expect(puz.answers[3]).toMatchGridWord(4, 5, 3, 'GFE',   2, 5, 0, 5);

            var c = puz.serialize();

            var quz = puzzle.makeFromSerialized(c);
            expect(quz).not.toBe(puz);
            expect(quz.size).toBe(6);
            expect(quz.seed).toBe(Number.MAX_SAFE_INTEGER);
            expect(quz.grid).not.toBe(puz.grid);
            expect(quz.grid).toEqual(puz.grid);
            for (var i=0; i<4; i++) {
                expect(quz.answers[i]).not.toBe(puz.answers[i]);
                expect(quz.answers[i]).toEqual(puz.answers[i]);
            }

            done();
        });

        it('outputs url-friendly base64 strings', function (done) {
            var puz = puzzle.makeFromParameters(14, .5, .5, 1485747095517);
            var s = puz.serialize();

            // serialized string should use '-' and '_' for its last two values;
            // base64 commonly uses '+' and '/', which are terrible for urls.
            expect(s.indexOf('-')).not.toBe(-1);
            expect(s.indexOf('_')).not.toBe(-1);
            expect(s.indexOf('+')).toBe(-1);
            expect(s.indexOf('/')).toBe(-1);
            expect(s.indexOf('?')).toBe(-1);
            expect(s.indexOf('&')).toBe(-1);

            var quz = puzzle.deserialize(s);
            expect(quz.size).toEqual(puz.size);
            expect(quz.seed).toEqual(puz.seed);
            expect(quz.grid).toEqual(puz.grid);
            expect(quz.answers.length).toEqual(puz.answers.length);
            expect(quz.answers).toEqual(puz.answers);

            done();
        });
    });

});

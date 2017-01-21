describe('Test Puzzle', function(){
    var data = require('../src/model/data');
    var grid = require('../src/model/grid');
    var puzzle = require('../src/model/puzzle');

    beforeEach(function() {
        jasmine.addMatchers({
            toMatchGridWord: function() {
                return {
                    compare: function (gw, d, s, o, w, sx, sy, ex, ey) {
                        return {
                            pass: (gw.direction === d &&
                                    gw.slice === s &&
                                    gw.offset === o &&
                                    gw.word === w &&
                                    gw.startLocation.x === sx &&
                                    gw.startLocation.y === sy &&
                                    gw.endLocation.x === ex &&
                                    gw.endLocation.y === ey)
                        }
                    }
                };
            }
        });
    });

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

            var quz = puzzle.deserialize(c);
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
            puz = new puzzle.Puzzle(14, 1484958199922);
            puz.generate(16);
            var s = puz.serialize();

            // string should use '-' and '_' for values 62 and 63; base64
            // commonly uses '+' and '/', which are terrible for urls.
            expect(s.indexOf('-')).not.toBe(-1);
            expect(s.indexOf('_')).not.toBe(-1);
            expect(s.indexOf('+')).toBe(-1);
            expect(s.indexOf('/')).toBe(-1);

            var quz = puzzle.deserialize(s);
            expect(quz.size).toEqual(14);
            expect(quz.grid).toEqual(puz.grid);
            expect(quz.answers.length).toEqual(16);
            expect(quz.answers).toEqual(puz.answers);

            done();
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

    describe('fitWord()', function() {
        beforeEach(function() {
            this.puz = new puzzle.Puzzle(6, 54321);
        });

        it('safely rejects empty arguments', function() {
            expect(this.puz.fitWord()).toBe(-1);
            expect(this.puz.fitWord('', '')).toBe(-1);
            expect(this.puz.fitWord('BAR', '')).toBe(-1);
            expect(this.puz.fitWord('', '   ')).toBe(-1);
        });

        it('can place words into a blank rack', function() {
            expect(this.puz.fitWord('BAR', '  ')).toBe(-1); // too short
            expect(this.puz.fitWord('BAR', '   ')).toBe(0);
            // offsets are starting to get seed dependent
            expect(this.puz.fitWord('BAR', '    ')).toBe(0);
            expect(this.puz.fitWord('BAR', '     ')).toBe(1);
            expect(this.puz.fitWord('BAR', '      ')).toBe(1);
            expect(this.puz.fitWord('BAR', '       ')).toBe(3);
        });

        it('can fit words around existing letters in a rack', function() {
            expect(this.puz.fitWord('BAR', 'B  ')).toBe(0);
            expect(this.puz.fitWord('BAR', ' A ')).toBe(0);
            expect(this.puz.fitWord('BAR', '  R')).toBe(0);
            expect(this.puz.fitWord('BAR', 'X  R ')).toBe(1);
            expect(this.puz.fitWord('BAR', ' F ')).toBe(-1);
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
            expect(puz.containsWord('GF')).not.toBe(true);
            expect(puz.containsWord('GFF')).not.toBe(true);
        });
    });

    describe('makeAnswer()', function() {
        it('places a word into the grid and turns it into an answer', function() {
            var puz = new puzzle.Puzzle(6, 54321);
            expect(puz.makeAnswer('GRUNT')).toMatchGridWord(3, 6, 0, 'GRUNT', 5, 1, 1, 5);
            expect(puz.makeAnswer('FUNK')).toMatchGridWord(0, 4, 0, 'FUNK',  0, 4, 3, 4);
            expect(puz.makeAnswer('PARTY')).toMatchGridWord(2, 4, 0, 'PARTY', 4, 0, 4, 4);
        });
        it('freaks out when it can\'t fit a word', function() {
            var puz = new puzzle.Puzzle(6, 54321);
            expect(()=>{ return puz.makeAnswer('TOOLONGWORD'); }).toThrowError();
            puz.makeAnswer('GRUNT');
            puz.makeAnswer('FUNK');
            puz.makeAnswer('PARTY');
            expect(()=>{ return puz.makeAnswer('BADWORD'); }).toThrowError();
        });
    });

    describe('scanConflicts()', function () {
        beforeEach(function(done) {
            data.load(null, function() {
                done();
            });
        });

        it('fixes duplicate or blacklisted words in the grid fill', function(done) {
            /*
             * REGGIW
             * KHIJKL
             * ENOPQR
             * FTUVGX
             * GZABCD
             * EFGHIJ
             *
             * This should fix:
             * - blacklist 4 0 0 WIGGER -> SAWKMX
             * - duplicate 6 0 1 GFE -> EUO
             * - on rescan, new duplicate 6 0 2 UO -> PL
             * Palindrome GBG should pass in both directions
             */
            var puz = new puzzle.Puzzle(6, 54321);
            var g = new grid.Grid(6).fromString('REGGIWKHIJKLENOPQRFTUVGXGZABCDEFGHIJ');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));
            expect(puz.answers[0]).toMatchGridWord(3, 7, 1, 'GBG',   4, 3, 2, 5);
            expect(puz.answers[1]).toMatchGridWord(6, 2, 2, 'UO',    2, 3, 2, 2);
            expect(puz.answers[2]).toMatchGridWord(1, 4, 0, 'KNUBI', 0, 1, 4, 5);
            expect(puz.answers[3]).toMatchGridWord(4, 5, 3, 'GFE',   2, 5, 0, 5);
            puz.scanConflicts();
            expect(puz.grid.toString()).toBe('SAWKMX\nKHIJKL\nLNOPQR\nPTUVGX\nEZABCD\nEFGHIJ\n')
            done();
        });

        it('sometimes can\'t fix conflicts', function(done) {
            /*
             * ABCDE
             * FGHIJ
             * KKNID
             * PQRST
             * UVWXY
             *
             * blacklist 4 2 0 DINK should be fixed, but it can't b/c all its
             * letters are tied up in answers.
             * duplicate 5 7 0 JD could be fixed, but isn't because the failed
             * fix threw an exception.
             */
            puz = new puzzle.Puzzle(5, 65432);
            g = new grid.Grid(5).fromString('ABCDEFGHIJKKNIDPQRSTUVWXY');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(5, g.readWord(2,1,1,3), 2, 1, 1));
            puz.addAnswer(new grid.GridWord(5, g.readWord(2,2,0,4), 2, 2, 0));
            puz.addAnswer(new grid.GridWord(5, g.readWord(2,3,2,3), 2, 3, 2));
            puz.addAnswer(new grid.GridWord(5, g.readWord(2,4,1,2), 2, 4, 1));
            expect(puz.answers[0]).toMatchGridWord(2, 1, 1, 'GKQ',  1, 1, 1, 3);
            expect(puz.answers[1]).toMatchGridWord(2, 2, 0, 'CHNR', 2, 0, 2, 3);
            expect(puz.answers[2]).toMatchGridWord(2, 3, 2, 'ISX',  3, 2, 3, 4);
            expect(puz.answers[3]).toMatchGridWord(2, 4, 1, 'JD',   4, 1, 4, 2);
            try {
                puz.scanConflicts();
            } catch (e) {
                if (e instanceof puzzle.PuzzleConflictError) {
                    expect(puz.grid.toString()).toBe('ABCDE\nFGHIJ\nKKNID\nPQRST\nUVWXY\n')
                } else {
                    fail(e);
                }
            }
            done();
        });
    });

    describe('constructing with pre-set words', function() {
        it('puts the words in the grid and turns them into answers', function() {
            var puz = new puzzle.Puzzle(7, -215423, []);
            expect(puz.answers.length).toBe(0);

            puz = new puzzle.Puzzle(7, -215423, ['FOO']);
            expect(puz.answers.length).toBe(1);
            expect(puz.answers[0]).toMatchGridWord(5, 3, 0, 'FOO', 3, 6, 1, 4);

            puz = new puzzle.Puzzle(7, -215423, ['GUNK', 'GOOP', 'GRIZ']);
            expect(puz.answers.length).toBe(3);
            expect(puz.answers[0]).toMatchGridWord(5, 3, 0, 'GUNK', 3, 6, 0, 3);
            expect(puz.answers[1]).toMatchGridWord(2, 2, 1, 'GOOP', 2, 1, 2, 4);
            expect(puz.answers[2]).toMatchGridWord(5, 8, 1, 'GRIZ', 5, 3, 2, 0);
        });

        it('generates around the given words', function() {
            puz = new puzzle.Puzzle(7, -215423, ['GUNK', 'GOOP', 'GRIZ']);
            puz.generate(5);
            expect(puz.answers[0]).toMatchGridWord(5, 3, 0, 'GUNK', 3, 6, 0, 3);
            expect(puz.answers[1]).toMatchGridWord(2, 2, 1, 'GOOP', 2, 1, 2, 4);
            expect(puz.answers[2]).toMatchGridWord(5, 8, 1, 'GRIZ', 5, 3, 2, 0);
            // generated one
            expect(puz.answers[3]).toMatchGridWord(0, 4, 2, 'PILOT', 2, 4, 6, 4);
            expect(puz.answers[4]).toMatchGridWord(5, 5, 0, 'UNION', 5, 6, 1, 2);
            expect(puz.grid.toString()).toBe('EDZCXIL\nPBGIPJL\nNNOXRBB\nKVOUNGY\nFNPILOT\nADUZNJZ\nJAXGLUB\n');
        });

        it('does nothing if you generate() fewer words than you fed in', function() {
            puz = new puzzle.Puzzle(7, -215423, ['GUNK', 'GOOP', 'GRIZ']);
            puz.generate(2);
            expect(puz.answers.length).toBe(3);
        });

        it('increases grid size if there isn\'t room for the given words', function() {
            puz = new puzzle.Puzzle(4, -215423, ['GUNK', 'GOOP', 'GRIZ', 'TWIZZLE' ]);
            expect(puz.size).toBe(7);
        });

        it('freaks out when it can\'t fit a word', function() {
            expect(()=>{
                return new puzzle.Puzzle(7, -215423,
                    ['GUNK', 'GOOP', 'GRIZ', 'SPOONY', 'TWIZZLE', 'FIDDLE', 'HANKER']);
            }).toThrowError(puzzle.PuzzleConflictError);
        });
    });

});

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

        it('replaces non-url-friendy punctuation in its base64 output', function (done) {
            puz = new puzzle.Puzzle(14, 1484519471118);
            puz.generate(16);
            var s = puz.serialize();

            // the base64 string contained multiple '+' characters, which we
            // should replace with '_' so that they don't get turned into
            // spaces by a browser.
            expect(s).toBe('AVcABWaRBeA5EYDaqZSBmKMZSRfJ3slR5qrSoQowPp9RSyIQxZtWgzFoGmLhlppZpaUkFDoUI7JtJM0EDLK6GceeXUCdspuPNM4VZSqAqCMNanfUtBrm-mjyfibaSshYUTo6L4PKEtrMjNMhBY2xcDnMz7ncEKZBROjXBoV6KTJeF4wg0DkZqDcwRaUEkMEZphPTRGqgD0QJEEMnSEVlBPxQFagTAYx4IMw=');

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
            var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJ');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));

            expect(puz.containsWord('WBG')).toBe(true);
            expect(puz.containsWord('UO')).toBe(true);
            expect(puz.containsWord('GNUBI')).toBe(true);
            expect(puz.containsWord('GFE')).toBe(true);
            expect(puz.containsWord('GF')).not.toBe(true);
            expect(puz.containsWord('GFF')).not.toBe(true);
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
             * GHIJKL
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
            var g = new grid.Grid(6).fromString('REGGIWGHIJKLENOPQRFTUVGXGZABCDEFGHIJ');
            puz.setGrid(g);
            puz.addAnswer(new grid.GridWord(6, g.readWord(3,7,1,3), 3, 7, 1));
            puz.addAnswer(new grid.GridWord(6, g.readWord(6,2,2,2), 6, 2, 2));
            puz.addAnswer(new grid.GridWord(6, g.readWord(1,4,0,5), 1, 4, 0));
            puz.addAnswer(new grid.GridWord(6, g.readWord(4,5,3,3), 4, 5, 3));
            expect(puz.answers[0]).toMatchGridWord(3, 7, 1, 'GBG',   4, 3, 2, 5);
            expect(puz.answers[1]).toMatchGridWord(6, 2, 2, 'UO',    2, 3, 2, 2);
            expect(puz.answers[2]).toMatchGridWord(1, 4, 0, 'GNUBI', 0, 1, 4, 5);
            expect(puz.answers[3]).toMatchGridWord(4, 5, 3, 'GFE',   2, 5, 0, 5);
            puz.scanConflicts();
            expect(puz.grid.toString()).toBe('SAWKMX\nGHIJKL\nLNOPQR\nPTUVGX\nEZABCD\nEFGHIJ\n')
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
                if (e instanceof puzzle.ConflictScanException) {
                    expect(puz.grid.toString()).toBe('ABCDE\nFGHIJ\nKKNID\nPQRST\nUVWXY\n')
                } else {
                    fail(e);
                }
            }
            done();
        });

    });

});

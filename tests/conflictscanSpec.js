describe('Test conflictscan', function(){
    var Random = require('random-js');
    var data = require('../src/model/data');
    var grid = require('../src/model/grid');
    var puzzle = require('../src/model/puzzle');
    var conflictscan = require('../src/model/conflictscan');

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
            conflictscan.scan(puz, function() { return Random.pick(puz.rng, consts.ALPHABET); });
            expect(puz.grid.toString()).toBe('SAWKMX\nKHIJKL\nONOPQR\nUTUVGX\nEZABCD\nEFGHIJ\n')
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
                conflictscan.scan(puz, function() { return Random.pick(puz.rng, consts.ALPHABET); });
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

});


var data = require('../src/data');
var grid = require('../src/grid');
var puzzle = require('../src/puzzle');

var consts = require('../src/consts');
function makeFatPuzzle(sz) {
    var puz = new puzzle.Puzzle();
    var gs = ''
    for (var i=0; i<sz*sz; i++) {
        gs += consts.ALPHABET[i%26];
    }
    var g = new grid.Grid(sz).fromString(gs);
    puz.setGrid(g);
    for (i=0; i<4; i++) {
        var slices = sz;
        if (i%2 == 1)
            slices = sz * 2 - 1;
        for (var j=0; j<slices; j++) {
            var wlen = sz;
            if (i%2==1)
                wlen = (j<sz) ? j : (sz*2-1-j)
            puz.addAnswer(new grid.GridWord(g.readWord(0, i, 0, wlen), 0, i, 0));
        }
    }
    puz.generate();
    return puz;
}

function checkGridWord(test, gw, d, s, o, w) {
    test.equal(gw.direction, d);
    test.equal(gw.slice, s);
    test.equal(gw.offset, o);
    test.equal(gw.word, w);
}

exports.TestPuzzle = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    },

    testSerialize: function(test) {
        for (var i=4; i<=16; i++) {
            puz = makeFatPuzzle(i);
            puz.serialize();
        }

        var puz = new puzzle.Puzzle();
        var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJ');
        puz.setGrid(g);
        puz.addAnswer(new grid.GridWord(g.readWord(3,7,1,3), 3, 7, 1));
        puz.addAnswer(new grid.GridWord(g.readWord(6,2,2,2), 6, 2, 2));
        puz.addAnswer(new grid.GridWord(g.readWord(1,4,0,5), 1, 4, 0));
        puz.addAnswer(new grid.GridWord(g.readWord(4,5,3,3), 4, 5, 3));
        test.equal(puz.answers[0].word, 'WBG');
        test.equal(puz.answers[1].word, 'UO');
        test.equal(puz.answers[2].word, 'GNUBI');
        test.equal(puz.answers[3].word, 'GFE');

        var c = puz.serialize();
        //test.equal(c, 'FsQgxRyU1GLNPRjlpNVenHUQgxRzUFK0E3PFsRCpLwTquCoSy8wxBQAAAAAAAAA=');

        var quz = puzzle.deserialize(c);
        test.equal(quz.size, 6);
        test.equal(quz.grid.toString(), puz.grid.toString());
        checkGridWord(test, quz.answers[0], 3, 7, 1, 'WBG');
        checkGridWord(test, quz.answers[1], 6, 2, 2, 'UO');
        checkGridWord(test, quz.answers[2], 1, 4, 0, 'GNUBI');
        checkGridWord(test, quz.answers[3], 4, 5, 3, 'GFE');

        test.done();
    },

    testAnswerGrid: function(test) {
        var puz = new puzzle.Puzzle();
        var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
        puz.setGrid(g);
        puz.addAnswer(new grid.GridWord(g.readWord(3,7,1,3), 3, 7, 1));
        puz.addAnswer(new grid.GridWord(g.readWord(6,2,2,2), 6, 2, 2));
        puz.addAnswer(new grid.GridWord(g.readWord(1,4,0,5), 1, 4, 0));
        puz.addAnswer(new grid.GridWord(g.readWord(4,5,3,3), 4, 5, 3));
        var h = puz.answerGrid();
        test.equal(h.toString(), '      \nG     \n NO   \n  U W \n   1  \n456 8 \n');
        test.done();
    },

    testFitWord: function(test) {
        var puz = new puzzle.Puzzle(6, 54321);
        test.equal(puz.fitWord('', ''), -1);
        test.equal(puz.fitWord('BAR', ''), -1);
        test.equal(puz.fitWord('', '   '), -1);

        test.equal(puz.fitWord('BAR', '  '), -1);
        test.equal(puz.fitWord('BAR', '   '), 0);
        // starting to get seed dependent
        test.equal(puz.fitWord('BAR', '    '), 0);
        test.equal(puz.fitWord('BAR', '     '), 1);
        test.equal(puz.fitWord('BAR', '      '), 1);
        test.equal(puz.fitWord('BAR', '       '), 3);

        test.equal(puz.fitWord('BAR', 'B  '), 0);
        test.equal(puz.fitWord('BAR', ' A '), 0);
        test.equal(puz.fitWord('BAR', '  R'), 0);
        test.equal(puz.fitWord('BAR', 'X  R '), 1);
        test.equal(puz.fitWord('BAR', ' F '), -1);

        test.done();
    },

    testContainsWord: function(test) {
        var puz = new puzzle.Puzzle(6, 54321);
        var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJ');
        puz.setGrid(g);
        puz.addAnswer(new grid.GridWord(g.readWord(3,7,1,3), 3, 7, 1));
        puz.addAnswer(new grid.GridWord(g.readWord(6,2,2,2), 6, 2, 2));
        puz.addAnswer(new grid.GridWord(g.readWord(1,4,0,5), 1, 4, 0));
        puz.addAnswer(new grid.GridWord(g.readWord(4,5,3,3), 4, 5, 3));

        test.ok(puz.containsWord('WBG'));
        test.ok(puz.containsWord('UO'));
        test.ok(puz.containsWord('GNUBI'));
        test.ok(puz.containsWord('GFE'));
        test.ok(!puz.containsWord('GF'));
        test.ok(!puz.containsWord('GFF'));

        test.done();
    }

};

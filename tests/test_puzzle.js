var lz = require('lz-string');
var data = require('../src/data');
var grid = require('../src/grid');
var puzzle = require('../src/puzzle');

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
        var puz = new puzzle.Puzzle();
        var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
        puz.setGrid(g);
        puz.addAnswer(new grid.GridWord(g.readWord(3,7,1,3), 3, 7, 1));
        puz.addAnswer(new grid.GridWord(g.readWord(6,2,2,2), 6, 2, 2));
        puz.addAnswer(new grid.GridWord(g.readWord(1,4,0,5), 1, 4, 0));
        puz.addAnswer(new grid.GridWord(g.readWord(4,5,3,3), 4, 5, 3));
        test.equal(puz.answers[0].word, 'W16');
        test.equal(puz.answers[1].word, 'UO');
        test.equal(puz.answers[2].word, 'GNU18');
        test.equal(puz.answers[3].word, '654');

        var c = puzzle.serialize(puz);
        test.equal(c, 'GwLgggQgwgIgogMQOIAkCSApA0gGQLIByA8gAoCKASgMoAqAqgGoDqAGgJoBaADAIwBMAZgAsAVmAB2ABwBOEAIA04+T3lMewANzB5fHfLpENKofK7ykBOj0kaTI+QuAihGoA');
        var s = lz.decompressFromEncodedURIComponent(c);
        test.equal(s,
        '6:ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:3,7,1,W16;6,2,2,UO;1,4,0,GNU18;4,5,3,654;');

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

    testDeserialize: function(test) {
        var s = '5:ABCDEFGHIJKLMNOPQRSTUVWXY:0,1,2,HIJ;5,4,1,SMGA;7,3,0,PLHD;';
        var c = lz.compressToEncodedURIComponent(s);
        test.equal(c, 'KwLgggQgwgIgogMQOIAkCSApA0gGQLIByA8gAoCKASgMoAqAqgGoDqAGgJogAMANAIzcAmbugwBuYNwAsfblTxIwogOzcAzNx4kcKGKKA');
        var p = puzzle.deserialize(c);

        test.equal(p.answers.length, 3);
        checkGridWord(test, p.answers[0], 0, 1, 2, 'HIJ');
        checkGridWord(test, p.answers[1], 5, 4, 1, 'SMGA');
        checkGridWord(test, p.answers[2], 7, 3, 0, 'PLHD');
        test.equal(p.size, 5);
        test.equal(p.grid.size, 5);
        test.equal(p.grid.toString(), 'ABCDE\nFGHIJ\nKLMNO\nPQRST\nUVWXY\n');

        test.done();
    },

    testParam: function(test) {
        data.load(null, function() {
            var p = new puzzle.Puzzle(5, 123);
            p.generate(4);
            test.equal(p.grid.toString(), 'DSIMV\nOCODM\nOHPOJ\nWAJGM\nMVTQR\n');
            test.equal(p.seed, 123);
            test.equal(p.answers.length, 4);
            checkGridWord(test, p.answers[0], 5, 5, 0, 'MOOS');
            checkGridWord(test, p.answers[1], 7, 3, 0, 'WHOM');
            checkGridWord(test, p.answers[2], 2, 1, 0, 'SCHAV');
            checkGridWord(test, p.answers[3], 6, 0, 1, 'WOOD');

            var q = puzzle.fromParameters('123-5-4');
            test.equal(q.grid.toString(), 'DSIMV\nOCODM\nOHPOJ\nWAJGM\nMVTQR\n');
            test.equal(q.seed, 123);
            test.equal(q.answers.length, 4);
            checkGridWord(test, q.answers[0], 5, 5, 0, 'MOOS');
            checkGridWord(test, q.answers[1], 7, 3, 0, 'WHOM');
            checkGridWord(test, q.answers[2], 2, 1, 0, 'SCHAV');
            checkGridWord(test, q.answers[3], 6, 0, 1, 'WOOD');

            test.done();
        });
    }

};

var lz = require('lz-string');
var grid = require('../src/grid');
var puzzle = require('../src/puzzle');

exports.TestPuzzle = {
    setUp: function(callback) {
        callback();
    },
    tearDown: function(callback) {
        callback();
    },

    testSerialize: function(test) {
        var g = new grid.Grid(6).fromString('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

        var a = [];
        a.push(new grid.GridWord(g.readWord(3,7,1,3), 3, 7, 1));
        a.push(new grid.GridWord(g.readWord(6,2,2,2), 6, 2, 2));
        a.push(new grid.GridWord(g.readWord(1,4,0,5), 1, 4, 0));
        a.push(new grid.GridWord(g.readWord(4,5,3,3), 4, 5, 3));
        test.equal(a[0].word, 'W16');
        test.equal(a[1].word, 'UO');
        test.equal(a[2].word, 'GNU18');
        test.equal(a[3].word, '654');

        var c = puzzle.serialize(a, g);
        test.equal(c, 'GwLgggQgwgIgogMQOIAkCSApA0gGQLIByA8gAoCKASgMoAqAqgGoDqAGgJoBaADAIwBMAZgAsAVmAB2ABwBOEAIA04+T3lMewANzB5fHfLpENKofK7ykBOj0kaTI+QuAihGoA');
        var s = lz.decompressFromEncodedURIComponent(c);
        test.equal(s,
        '6:ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:3,7,1,W16;6,2,2,UO;1,4,0,GNU18;4,5,3,654;');

        test.done();
    },

    testDeserialize: function(test) {
        var s = '5:ABCDEFGHIJKLMNOPQRSTUVWXY:0,1,2,HIJ;5,4,1,SMGA;7,3,0,PLHD;';
        var c = lz.compressToEncodedURIComponent(s);
        test.equal(c, 'KwLgggQgwgIgogMQOIAkCSApA0gGQLIByA8gAoCKASgMoAqAqgGoDqAGgJogAMANAIzcAmbugwBuYNwAsfblTxIwogOzcAzNx4kcKGKKA');
        var p = puzzle.deserialize(c);

        test.equal(p[0].length, 3);
        test.equal(p[0][0].direction, 0);
        test.equal(p[0][0].slice, 1);
        test.equal(p[0][0].offset, 2);
        test.equal(p[0][0].word, 'HIJ');
        test.equal(p[0][1].direction, 5);
        test.equal(p[0][1].slice, 4);
        test.equal(p[0][1].offset, 1);
        test.equal(p[0][1].word, 'SMGA');
        test.equal(p[0][2].direction, 7);
        test.equal(p[0][2].slice, 3);
        test.equal(p[0][2].offset, 0);
        test.equal(p[0][2].word, 'PLHD');

        test.equal(p[1].size, 5);
        test.equal(p[1].toString(), 'A  D \n GHIJ\n LM  \nP  S \n     \n');

        test.equal(p[2].size, 5);
        test.equal(p[2].toString(), 'ABCDE\nFGHIJ\nKLMNO\nPQRST\nUVWXY\n');

        test.done();
    }

};

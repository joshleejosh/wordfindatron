(function () {
'use strict';

var Random = require('random-js');
var lz = require('lz-string');
var consts = require('./consts');
var util = require('./util');
var grid = require('./grid');
var data = require('./data');

var RNG = Random.engines.mt19937();
function seedRNG(v) {
    RNG.seed(v);
}

// ==================================================================

// Build array of slices to pick from.
// But only do half the directions; we'll handle mirrors below, but we
// don't want any reverse collisions while looking for slots.
function shuffleSlices(size) {
    var sa = [];
    for (var d=0; d<4; d++) {
        var a = 0, b = size;
        if (d%2 === 1) {
            a = consts.MIN_WORDLEN - 1;
            b = (size*2) - consts.MIN_WORDLEN;
        }
        for (var s=a; s<b; s++) {
            sa.push([d, s]);
        }
    }
    Random.shuffle(RNG, sa);
    return sa;
}

function fitWord(word, template) {
    var offsets = util.range(0, template.length - word.length + 1);
    Random.shuffle(RNG, offsets);
    for (var i=0; i<offsets.length; i++) {
        var offset = offsets[i];
        var wi = 0, ti = offset;
        while (wi < word.length && ti < template.length) {
            if (template[ti] !== ' ' && template[ti] !== word[wi]) {
                break;
            }
            wi++;
            ti++;
        }
        // we made it to the end of the word, so it fits.
        if (wi >= word.length) {
            return offset;
        }
    }
    return -1;
}

function findFittingWord(template, wordlen) {
    var tlen = template.length;
    if (tlen < consts.MIN_WORDLEN) {
        console.log('findFittingWord: Bad template ['+template+']');
        return null;
    }
    if (wordlen > tlen) {
        console.log('findFittingWord: bad word length ['+wordlen+'] for ['+template+']');
    }
    //console.log('Find word of length ['+wordlen+'] that fits into ['+template+']');

    var candidates = [];
    var wordlist = data.getWordlist(wordlen), blacklist = data.getBlacklist();
    for (var i=0; i<wordlist.length; i++) {
        var w = wordlist[i];
        if (w.length === wordlen && blacklist.indexOf(w) === -1) {
            var f = fitWord(w, template);
            if (f !== -1) {
                candidates.push([w, f]);
            }
        }
    }

    if (candidates.length === 0) {
        console.log('findFittingWord: no candidates for ['+wordlen+']['+template+']');
        return null;
    } else {
        //console.log(''+candidates.length+' candidates');
    }

    var pair = Random.pick(RNG, candidates);
    return pair;
}

function makePuzzle(size, nwords, seedv) {
    if (size === undefined) {
        size = 8;
    }
    if (nwords === undefined) {
        nwords = 8;
    }
    if (!seedv) {
        seedv = new Date().getTime();
    }
    console.log(seedv);
    seedRNG(seedv);

    var answers = [];
    var g = new grid.Grid(size);
    var sa = shuffleSlices(size);

    for (var i=0; answers.length<nwords && i<sa.length; i++) {
        var direction = sa[i][0], slicei = sa[i][1];
        // flip it?
        if (Random.bool()(RNG)) {
            direction = (direction + 4) % 8;
        }

        var sliceword = g.cutSlice(direction, slicei);
        var wordlens = util.range(
            Math.min(consts.MIN_WORDLEN, sliceword.length),
            Math.min(consts.MAX_WORDLEN, sliceword.length) + 1
        );
        Random.shuffle(RNG, wordlens);

        for (var j=0; j<wordlens.length; j++) {
            var p = findFittingWord(sliceword, wordlens[j]);
            if (p) {
                break;
            }
        }
        if (p) {
            var word = p[0];
            var offset = p[1];
            g.placeWord(direction, slicei, offset, word);
            answers.push(new grid.GridWord(word, direction, slicei, offset));
        } else {
            console.log('makePuzzle: gave up on ['+direction+'] ['+slicei+'] ['+sliceword+']');
        }
    }
    //console.log(g.toString());

    var filled = g.copy();
    filled.fillJunk(function(a) { return Random.pick(RNG, a); });
    return [answers, g, filled];
}

// ==================================================================

function serialize(answers, grid) {
    var s = grid.size + ':';
    for (var r=0; r<grid.size; r++) {
        for (var c=0; c<grid.size; c++) {
            s += grid.grid[r][c];
        }
    }
    s += ':';
    for (var i=0; i<answers.length; i++) {
        var a = answers[i];
        s += '' + a.direction + ',' +
            a.slice + ',' +
            a.offset + ',' +
            a.word + ';';
    }

    var rv = lz.compressToEncodedURIComponent(s);
    return rv;
}

function deserialize(c) {
    var s = lz.decompressFromEncodedURIComponent(c);
    var amain = s.split(':');

    var size = parseInt(amain[0], 10);
    var newGrid = new grid.Grid(size);
    newGrid.fromString(amain[1]);

    var newAnswers = [];
    var aanswers = amain[2].split(';');
    for (var i=0; i<aanswers.length; i++) {
        if (!aanswers[i]) {
            continue;
        }
        var aanswer = aanswers[i].split(',');
        var gw = new grid.GridWord(aanswer[3], parseInt(aanswer[0], 10), parseInt(aanswer[1], 10), parseInt(aanswer[2], 10));
        newAnswers.push(gw);
    }

    var answerGrid = new grid.Grid(size);
    for (i=0; i<newAnswers.length; i++) {
        answerGrid.placeWord(newAnswers[i].direction, newAnswers[i].slice, newAnswers[i].offset, newAnswers[i].word);
    }

    return [newAnswers, answerGrid, newGrid];
}


// ==================================================================

module.exports = {
    makePuzzle:makePuzzle,
    serialize:serialize,
    deserialize:deserialize
};

}());

// ==================================================================

const consts = require('./consts');
const util = require('./util');
const d3 = require('d3');
const grid = require('./grid');
const data = require('./data');

// ==================================================================

function wordFits(word, template) {
    var offsets = util.range(0, template.length - word.length + 1);
    d3.shuffle(offsets);
    for (var i=0; i<offsets.length; i++) {
        var offset = offsets[i];
        var wi = 0, ti = offset;
        while (wi < word.length && ti < template.length) {
            if (template[ti] != ' ' && template[ti] != word[wi])
                break;
            wi++;
            ti++;
        }
        if (wi >= word.length) // we made it to the end of the word, so it fits.
            return offset;
    }
    return -1
}

function findFittingWord (template) {
    var tlen = template.length;
    if (tlen < consts.MIN_WORDLEN) {
        console.log('findFittingWord: Bad template ['+template+']');
        return null;
    }

    var wordlen = util.rndint(Math.min(consts.MIN_WORDLEN, tlen), Math.min(consts.MAX_WORDLEN, template.length));
    //console.log('Find word of length ['+wordlen+'] that fits into ['+template+']');

    var candidates = [];
    var wordlist = data.getWordlist(wordlen), blacklist = data.getBlacklist();
    for (var i=0; i<wordlist.length; i++) {
        var w = wordlist[i];
        if (w.length == wordlen && blacklist.indexOf(w) == -1) {
            var f = wordFits(w, template);
            if (f != -1) {
                candidates.push([w, f]);
            }
        }
    }

    if (candidates.length == 0) {
        console.log('findFittingWord: no candidates for ['+wordlen+']['+template+']');
    } else {
        //console.log(''+candidates.length+' candidates');
    }

    var pair = candidates[util.rndint(0, candidates.length-1)];
    return pair;
}

function makePuzzle(size) {
    if (size === undefined)
        size = 8;
    var answers = [];
    var g = new grid.Grid(size);

    // Build array of slices to pick from.
    // But only do half the directions; we'll handle mirrors below, but we
    // don't want any reverse collisions while looking for slots.
    var sa = []
    for (var d=0; d<4; d++) {
        var a = 0, b = size;
        if (d%2 == 1)
            a = consts.MIN_WORDLEN - 1, b = (size*2) - consts.MIN_WORDLEN;
        for (var s=a; s<b; s++)
            sa.push([d, s]);
    }
    d3.shuffle(sa);

    var numWords = util.rndint(consts.MIN_WORDS, consts.MAX_WORDS);
    for (var i=0; i<numWords; i++) {
        var direction = sa[i][0], slicei = sa[i][1];
        // flip it?
        if (util.rnd() < .5)
            direction = (direction + 4) % 8;

        var sliceword = g.cutSlice(direction, slicei);

        var p = findFittingWord(sliceword);
        if (!p)
            continue;
        var word = p[0];
        var offset = p[1];
        //console.log(direction + ',' + slicei + ',[' + sliceword + '],['+word+'],['+offset+']');

        g.fillSlice(direction, slicei, offset, word);
        answers.push({
            word:word,
            direction:direction,
            slice:slicei,
            offset:offset,
        });
    }
    console.log(g.toString());

    var filled = g.copy();
    filled.fillJunk();
    return [answers, g, filled];
}

module.exports = {
    makePuzzle:makePuzzle,
};

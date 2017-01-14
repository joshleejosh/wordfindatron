(function () {
    'use strict';

    var Random = require('random-js');
    var lz = require('lz-string');
    var consts = require('./consts');
    var util = require('./util');
    var grid = require('./grid');
    var data = require('./data');

    // ==================================================================

    function Puzzle(size, seedv) {
        if (size === undefined) {
            size = 8;
        }
        if (!seedv) {
            seedv = new Date().getTime();
        }
        this.answers = [];
        this.size = size;
        this.grid = new grid.Grid(this.size);
        this.seed = seedv;
        this.rng = Random.engines.mt19937();
        this.rng.seed(this.seed);

        return this;
    }

    Puzzle.prototype.setGrid = function(g) {
        this.grid = g;
        this.size = this.grid.size;
    };

    Puzzle.prototype.addAnswer = function(a) {
        this.grid.placeWord(a);
        this.answers.push(a);
    };

    Puzzle.prototype.answerGrid = function() {
        var rv = new grid.Grid(this.grid.size);
        for (var i=0; i<this.answers.length; i++) {
            var a = this.answers[i];
            rv.placeWord(a);
        }
        return rv;
    };

    /*
     * Build array of slices to pick from.
     * But only do half the directions; we'll handle mirrors below, but we
     * don't want any reverse collisions while looking for slots.
     */
    Puzzle.prototype.shuffleSlices = function(size) {
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
        Random.shuffle(this.rng, sa);
        return sa;
    };

    /*
     * Try to lay the given word into the rack string, working around existing characters.
     */
    Puzzle.prototype.fitWord = function(word, rack) {
        var offsets = util.range(0, rack.length - word.length + 1);
        Random.shuffle(this.rng, offsets);
        for (var i=0; i<offsets.length; i++) {
            var offset = offsets[i];
            var wi = 0, ti = offset;
            while (wi < word.length && ti < rack.length) {
                if (rack[ti] !== ' ' && rack[ti] !== word[wi]) {
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
    };

    /*
     * find a word that fits into the rack string, working around any existing letters.
     */
    Puzzle.prototype.findFittingWord = function(rack, wordlen) {
        var tlen = rack.length;
        if (tlen < consts.MIN_WORDLEN) {
            util.log('findFittingWord: Bad rack ['+rack+']');
            return null;
        }
        if (wordlen > tlen) {
            util.log('findFittingWord: bad word length ['+wordlen+'] for ['+rack+']');
        }
        //util.log('Find word of length ['+wordlen+'] that fits into ['+rack+']');

        var candidates = [];
        var wordlist = data.getWordlist(wordlen), blacklist = data.getBlacklist();
        for (var i=0; i<wordlist.length; i++) {
            var w = wordlist[i];
            if (w.length === wordlen && blacklist.indexOf(w) === -1) {
                var f = this.fitWord(w, rack);
                if (f !== -1) {
                    candidates.push([w, f]);
                }
            }
        }

        if (candidates.length === 0) {
            //util.log('findFittingWord: no candidates for ['+wordlen+']['+rack+']');
            return null;
        }
        //util.log(''+candidates.length+' candidates');

        var pair = Random.pick(this.rng, candidates);
        return pair;
    };

    /* Make a puzzle! */
    Puzzle.prototype.generate = function(nwords) {
        var sa = this.shuffleSlices(this.size);

        for (var i=0; this.answers.length<nwords && i<sa.length; i++) {
            var direction = sa[i][0], slicei = sa[i][1];
            // flip it?
            if (Random.bool()(this.rng)) {
                direction = (direction + 4) % 8;
            }

            var rack = this.grid.cutSlice(direction, slicei);
            var wordlens = util.range(
                Math.min(consts.MIN_WORDLEN, rack.length),
                Math.min(consts.MAX_WORDLEN, rack.length) + 1
            );
            Random.shuffle(this.rng, wordlens);

            var p;
            for (var j=0; j<wordlens.length; j++) {
                p = this.findFittingWord(rack, wordlens[j]);
                if (p) {
                    break;
                }
            }
            if (p) {
                var gw = new grid.GridWord(p[0], direction, slicei, p[1]);
                this.addAnswer(gw);
            } else {
                util.log('generate: gave up on ['+direction+'] ['+slicei+'] ['+rack+']');
            }
        }
        //util.log(this.grid.toString());

        var rr = this.rng;
        this.grid.fillJunk(function(a) {
            return Random.pick(rr, a);
        });
    };

    // ==================================================================

    function serialize(puz) {
        var s = puz.grid.size + ':';
        for (var r=0; r<puz.grid.size; r++) {
            for (var c=0; c<puz.grid.size; c++) {
                s += puz.grid.grid[r][c];
            }
        }
        s += ':';
        for (var i=0; i<puz.answers.length; i++) {
            var a = puz.answers[i];
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
        var puz = new Puzzle(size);
        var newGrid = new grid.Grid(size);
        newGrid.fromString(amain[1]);
        puz.setGrid(newGrid);

        var aanswers = amain[2].split(';');
        for (var i=0; i<aanswers.length; i++) {
            if (!aanswers[i]) {
                continue;
            }
            var aanswer = aanswers[i].split(',');
            var gw = new grid.GridWord(aanswer[3], parseInt(aanswer[0], 10), parseInt(aanswer[1], 10), parseInt(aanswer[2], 10));
            puz.addAnswer(gw);
        }

        return puz;
    }

    // ==================================================================

    function fromParameters(h) {
        var a = h.split('-');
        var s, z, w;
        if (a.length > 0) {
            s = parseInt(a[0], 10);
        }
        if (a.length > 1) {
            z = parseInt(a[1], 10);
        }
        if (a.length > 2) {
            w = parseInt(a[2], 10);
        }
        var p = new Puzzle(z, s);
        p.generate(w);
        return p;
    }

    // ==================================================================

    module.exports = {
        Puzzle: Puzzle,
        serialize: serialize,
        deserialize: deserialize,
        fromParameters: fromParameters
    };

}());

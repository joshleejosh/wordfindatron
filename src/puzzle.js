(function () {
    'use strict';

    var Random = require('random-js');
    var bitBuffer = require('bit-buffer');
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
            util.log(seedv);
        }
        this.answers = [];
        this.words = [];
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
        this.words.push(a.word);
    };

    Puzzle.prototype.answerGrid = function() {
        var rv = new grid.Grid(this.grid.size);
        for (var i=0; i<this.answers.length; i++) {
            var a = this.answers[i];
            rv.placeWord(a);
        }
        return rv;
    };

    Puzzle.prototype.containsWord = function(w) {
        return (this.words.indexOf(w) !== -1);
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
        if (!word || !rack) {
            return -1;
        }
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

        var candidates = [];
        var wordlist = data.getWordlist(wordlen), blacklist = data.getBlacklist();
        for (var i=0; i<wordlist.length; i++) {
            var w = wordlist[i];
            if (w.length === wordlen && blacklist.indexOf(w) === -1 && !this.containsWord(w)) {
                var f = this.fitWord(w, rack);
                if (f !== -1) {
                    candidates.push([w, f]);
                }
            }
        }

        if (candidates.length === 0) {
            return null;
        }

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

        var rr = this.rng;
        this.grid.fillJunk(function(a) {
            return Random.pick(rr, a);
        });
    };

    // ==================================================================

    var NLEN_NLEN = 4,   // nibble length 4, allows grid sizes up to (2^n)^2
        NLEN_LETTER = 5, // 26 letters
        NLEN_DIR = 3;    // 8 directions

    Puzzle.prototype.serialize = function() {
        var nlen = Math.ceil(Math.log2(Math.max(this.size, this.answers.length)) + 1);
        var bufsz = Math.ceil((
            (NLEN_NLEN) + // nibble length
            (nlen) + // size
            (NLEN_LETTER*this.size*this.size) + // grid
            (nlen) + // number of answers
            (NLEN_DIR*this.answers.length) + // directions
            ((nlen+1)*this.answers.length) + // slices
            (nlen*this.answers.length) + // offsets
            (nlen*this.answers.length) // lengths
        ) / 8);

        var buf = new ArrayBuffer(bufsz);
        var bs = new bitBuffer.BitStream(buf);
        bs.writeBits(nlen, NLEN_NLEN);
        bs.writeBits(this.size, nlen);
        for (var r=0; r<this.grid.size; r++) {
            for (var c=0; c<this.grid.size; c++) {
                // A = 1, Z = 26
                var n = this.grid.grid[r][c].charCodeAt(0) - 64;
                bs.writeBits(n, NLEN_LETTER);
            }
        }

        bs.writeBits(this.answers.length, nlen);
        for (var i=0; i<this.answers.length; i++) {
            bs.writeBits(this.answers[i].direction, NLEN_DIR);
            bs.writeBits(this.answers[i].slice, nlen+1);
            bs.writeBits(this.answers[i].offset, nlen);
            bs.writeBits(this.answers[i].word.length, nlen);
        }

        var rv = Buffer.from(buf).toString('base64').replace('+', '_').replace('/', '-');
        return rv;
    };

    function deserialize(instr) {
        var buf = Buffer.from(instr.replace('-', '/').replace('_', '+'), 'base64');
        var bs = new bitBuffer.BitStream(buf);

        var nlen = bs.readBits(NLEN_NLEN);
        var size = bs.readBits(nlen);
        var puz = new Puzzle(size);
        var gs = '';
        for (var r=0; r<size; r++) {
            for (var c=0; c<size; c++) {
                gs += String.fromCharCode(bs.readBits(NLEN_LETTER) + 64);
            }
        }
        puz.setGrid(new grid.Grid(size).fromString(gs));

        var nanswers = bs.readBits(nlen);
        for (var i=0; i<nanswers; i++) {
            var di = bs.readBits(NLEN_DIR);
            var sc = bs.readBits(nlen+1);
            var of = bs.readBits(nlen);
            var wl = bs.readBits(nlen);
            puz.addAnswer(new grid.GridWord(puz.grid.readWord(di, sc, of, wl), di, sc, of));
        }

        return puz;
    }

    // ==================================================================

    module.exports = {
        Puzzle: Puzzle,
        deserialize: deserialize
    };

}());

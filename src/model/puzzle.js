/*global Uint8Array*/

(function () {
    'use strict';

    var Random = require('random-js');
    var bstream = require('./bstream');
    var consts = require('../consts');
    var util = require('../util');
    var grid = require('./grid');
    var data = require('./data');
    var conflictscan = require('./conflictscan');

    function isPalindrome(w) {
        var x = w.split('').reverse().join(''); // FIXME: fails on unicode
        return (w === x);
    }

    // ==================================================================

    function Puzzle(size, seedv, wordlist) {
        if (size === undefined) {
            size = 8;
        }
        if (size < 0) {
            throw new RangeError('size ['+size+']');
        }
        if (wordlist) {
            for (var mi=0; mi<wordlist.length; mi++) {
                if (wordlist[mi].length > size) {
                    size = wordlist[mi].length;
                }
            }
        }

        if (!seedv) {
            seedv = new Date().getTime();
        }
        if (typeof seedv !== 'number') {
            throw new TypeError('bad seed ['+seedv+']');
        }

        this.answers = [];
        this.words = [];
        this.size = size;
        this.grid = new grid.Grid(this.size);
        this.setSeed(seedv);

        if (wordlist) {
            for (var i=0; i<wordlist.length; i++) {
                this.makeAnswer(wordlist[i]);
            }
        }

        return this;
    }

    Puzzle.prototype.reset = function(newseed) {
        this.grid.reset();
        this.answers = [];
        this.words = [];

        if (newseed === undefined) {
            newseed = this.seed;
        }
        this.setSeed(newseed);
    };

    Puzzle.prototype.copy = function() {
        var rv = new Puzzle(this.size, this.seed);
        rv.setGrid(this.grid.copy());
        for (var i=0; i<this.answers.length; i++) {
            var a = this.answers[i];
            var b = new grid.GridWord(this.size, a.word, a.direction, a.slice, a.offset);
            rv.addAnswer(b);
        }
        return rv;
    };

    Puzzle.prototype.setSeed = function(newseed) {
        this.seed = newseed;
        this.rng = Random.engines.mt19937();
        this.rng.seed(this.seed);
    };

    Puzzle.prototype.setGrid = function(g) {
        this.grid = g;
        this.size = this.grid.size;
    };

    Puzzle.prototype.answerGrid = function() {
        var rv = new grid.Grid(this.grid.size);
        for (var i=0; i<this.answers.length; i++) {
            var a = this.answers[i];
            rv.placeWord(a);
        }
        return rv;
    };

    Puzzle.prototype.addAnswer = function(a) {
        this.grid.placeWord(a);
        this.answers.push(a);
        this.words.push(a.word);
    };

    Puzzle.prototype.isAnswer = function(word, di, si, of, wl) {
        for (var i=0; i<this.answers.length; i++) {
            var a = this.answers[i];
            if (a.direction===di && a.slice===si && a.offset===of && a.word.length===wl) {
                return true;
            }
            // is the word a palindrome and is this its reverse slice?
            if (isPalindrome(word)) {
                var slicelen = this.grid.cutSlice(di, si, of).length;
                if (a.direction===((di+4)%8) && a.slice===si && a.offset===(slicelen-word.length) && a.word.length===wl) {
                    return true;
                }
            }
        }
        return false;
    };

    /*
     * Find a place for the given word in the grid and make it an answer..
     */
    Puzzle.prototype.makeAnswer = function(word) {
        var sa = this.shuffleSlices(this.size);
        for (var i=0; i<sa.length; i++) {
            var direction = sa[i][0], slicei = sa[i][1];
            // flip it?
            if (Random.bool()(this.rng)) {
                direction = (direction + 4) % 8;
            }

            var rack = this.grid.cutSlice(direction, slicei);
            var offset = this.fitWord(word, rack);
            if (offset !== -1) {
                var gw = new grid.GridWord(this.size, word, direction, slicei, offset);
                this.addAnswer(gw);
                return gw;
            }
        }
        throw new conflictscan.PuzzleConflictError('makeAnswer: Couldn\'t fit ['+word+']!');
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
        util.sloppyShuffle(this.rng, offsets);
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
        // ASSERTION: wordlist has been pre-stripped of blacklist words, so we don't need to check against it.
        var wordlist = data.getWordlist(wordlen);
        for (var i=0; i<wordlist.length; i++) {
            var w = wordlist[i];
            if (w.length === wordlen && !this.containsWord(w)) {
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

    Puzzle.prototype.scanConflicts = function() {
        // when we find and fix bad words, we have to do another scan to make
        // sure we didn't replace them with other bad words.
        for (var rescans=0; rescans<=consts.MAX_CONFLICT_RETRIES; rescans++) {
            var foundConflicts = conflictscan.scan(this);
            if (!foundConflicts) {
                return;
            }
        }
        throw new conflictscan.PuzzleConflictError(0, 0, 0, 0, 'TOOMANYRETRIES');
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
                var gw = new grid.GridWord(this.grid.size, p[0], direction, slicei, p[1]);
                this.addAnswer(gw);
            } else {
                util.log('generate: gave up on ['+direction+'] ['+slicei+'] ['+rack+']');
            }
        }

        var rr = this.rng;
        this.grid.fillJunk(function(a) {
            return Random.pick(rr, a);
        });

        this.scanConflicts();
    };

    // ==================================================================

    var DATA_VERSION = 1;
    var NLEN_VERSION = 8,
        NLEN_NLEN = 4,   // length of the *declaration* of the nibble length. Allows grid sizes up to (2^n)^2
        NLEN_SEED_HI = 23,
        NLEN_SEED_LO = 30,
        NLEN_LETTER = 5, // 26 letters
        NLEN_DIR = 3;    // 8 directions

    Puzzle.prototype.serialize = function() {
        var nlen = Math.ceil(Math.log2(Math.max(this.size, this.answers.length)) + 1);
        var bufsz = Math.ceil((
            (NLEN_VERSION) +
            (NLEN_NLEN) + // nibble length
            (nlen) + // size and size-related values
            (NLEN_SEED_HI + NLEN_SEED_LO) + // time seed can be 52 bits, so we have to split it into two parts
            (NLEN_LETTER*this.size*this.size) + // grid
            (nlen) + // number of answers
            (NLEN_DIR*this.answers.length) + // directions
            ((nlen+1)*this.answers.length) + // slices can be on [0,size*2)
            (nlen*this.answers.length) + // offsets
            (nlen*this.answers.length) // lengths
        ) / 8);

        var buf = new Uint8Array(bufsz);
        var bs = new bstream.BitStream(buf);

        bs.writeBits(DATA_VERSION, NLEN_VERSION);
        bs.writeBits(nlen, NLEN_NLEN);
        bs.writeBits(this.size, nlen);
        var so = bstream.splitInt(this.seed);
        bs.writeBits(so[0], NLEN_SEED_HI);
        bs.writeBits(so[1], NLEN_SEED_LO);

        for (var y=0; y<this.grid.size; y++) {
            for (var x=0; x<this.grid.size; x++) {
                // A = 1, Z = 26
                var n = this.grid.get(x, y).charCodeAt(0) - 64;
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

        var rv = bstream.toBase64(bs);
        return rv;
    };

    function deserialize(instr) {
        var bs = bstream.fromBase64(instr);

        bs.readBits(NLEN_VERSION);
        var nlen = bs.readBits(NLEN_NLEN);
        var size = bs.readBits(nlen);
        var shi = bs.readBits(NLEN_SEED_HI);
        var slo = bs.readBits(NLEN_SEED_LO);
        var seed = bstream.joinInt(shi, slo);

        var puz = new Puzzle(size, seed);
        var gs = '';
        for (var y=0; y<size; y++) {
            for (var x=0; x<size; x++) {
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
            puz.addAnswer(new grid.GridWord(puz.grid.size, puz.grid.readWord(di, sc, of, wl), di, sc, of));
        }

        return puz;
    }

    // ==================================================================

    module.exports = {
        Puzzle: Puzzle,
        PuzzleConflictError: conflictscan.PuzzleConflictError,
        deserialize: deserialize
    };

}());

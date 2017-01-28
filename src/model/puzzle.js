/*global Uint8Array*/

(function () {
    'use strict';

    var Random = require('random-js');
    var bstream = require('./bstream');
    var consts = require('../consts');
    var util = require('../util');
    var grid = require('./grid');
    var puzgen = require('./puzgen');
    var conflictscan = require('./conflictscan');

    function isPalindrome(w) {
        var x = w.split('').reverse().join(''); // FIXME: fails on unicode
        return (w === x);
    }

    // ==================================================================

    function Puzzle(size, seedv, initWords) {
        if (size === undefined) {
            size = 8;
        }
        if (size < 0) {
            throw new RangeError('size ['+size+']');
        }
        if (initWords) {
            for (var mi=0; mi<initWords.length; mi++) {
                if (initWords[mi].length > size) {
                    size = initWords[mi].length;
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
        this.params = '' + this.seed;

        if (initWords) {
            for (var i=0; i<initWords.length; i++) {
                puzgen.makeAnswer(this, initWords[i]);
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

    Puzzle.prototype.shuffleAnswers = function() {
        Random.shuffle(this.rng, this.answers);
        this.words = this.answers.map(function(a) {
            return a.word;
        });
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

    Puzzle.prototype.containsWord = function(w) {
        if (this.words.indexOf(w) !== -1) {
            return true;
        }
        // also check substrings
        for (var i=0; i<this.words.length; i++) {
            if (this.words[i].lastIndexOf(w) !== -1) {
                return true;
            }
            // also check the inverse
            if (w.lastIndexOf(this.words[i]) !== -1) {
                return true;
            }
        }
        return false;
    };

    Puzzle.prototype.density = function() {
        var ag = this.answerGrid();
        var fillcount = 0;
        for (var y=0; y<ag.size; y++) {
            for (var x=0; x<ag.size; x++) {
                if (ag.grid[y][x] !== ' ') {
                    fillcount++;
                }
            }
        }
        return fillcount / (ag.size * ag.size);
    };

    Puzzle.prototype.reportStats = function() {
        return puzgen.reportStats();
    };

    Puzzle.prototype.generate = function(a, b) {
        this.params = '' + this.seed + ' ' +
            ((typeof a === 'undefined')?'':a) + ' ' +
            ((typeof b === 'undefined')?'':b);
        return puzgen.generate(this, a, b);
    };

    // ==================================================================
    // Puzzle serialization

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

    function makeFromSerialized(ser) {
        return deserialize(ser);
    }

    function makeFromParameters(size, density, wlen, seed) {
        var p;
        for (var i=0; i<consts.MAX_CONFLICT_RETRIES; i++) {
            try {
                p = new Puzzle(size, seed);
                p.generate(density, wlen);
                break;
            } catch (e) {
                if (e instanceof conflictscan.PuzzleConflictError) {
                    p = null;
                    util.log(e.message);
                    // if we're seeded, it's never going to succeed, so fail fast.
                    if (seed) {
                        break;
                    }
                } else {
                    throw e;
                }
            }
        }
        return p;
    }

    function makeFromWords(size, seed, words) {
        var p;
        for (var i=0; i<consts.MAX_CONFLICT_RETRIES; i++) {
            try {
                p = new Puzzle(size, seed, words);
                p.generate(words.length);
                break;
            } catch (e) {
                if (e instanceof conflictscan.PuzzleConflictError) {
                    p = null;
                    util.log(e.message);
                    // if we're seeded, it's never going to succeed, so fail fast.
                    if (seed) {
                        break;
                    }
                } else {
                    throw e;
                }
            }
        }
        return p;
    }

    // ==================================================================

    module.exports = {
        Puzzle: Puzzle,
        PuzzleConflictError: conflictscan.PuzzleConflictError,
        deserialize: deserialize,
        makeFromSerialized: makeFromSerialized,
        makeFromParameters: makeFromParameters,
        makeFromWords: makeFromWords
    };

}());

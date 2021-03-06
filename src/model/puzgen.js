(function () {
    'use strict';

    var Random = require('random-js');
    var d3 = require('d3');
    var consts = require('../consts');
    var util = require('../util');
    var data = require('./data');
    var grid = require('./grid');
    var conflictscan = require('./conflictscan');

    // ==================================================================

    /* Find the largest span of spaces in a string */
    function largestGap(s) {
        var curgap=0, maxgap=0;
        for (var i=0; i<s.length; i++) {
            if (s[i] === ' ') {
                curgap++;
            } else {
                if (curgap > maxgap) {
                    maxgap = curgap;
                }
                curgap = 0;
            }
        }
        if (curgap > maxgap) {
            maxgap = curgap;
        }
        return maxgap;
    }

    // ==================================================================

    /*
     * Maintains a shuffled deck of directions+slices.
     */
    function SliceShuffler(gen) {
        this.generator = gen;
        this.rng = this.generator.rng;
        this.gridSize = this.generator.puzzle.size;
        this.minLen = this.generator.minWordLen;

        {
            var dmin = this.minLen - 1;
            var dmax = (this.gridSize * 2) - this.minLen;
            this.length = (4 * this.gridSize) + (4 * (dmax - dmin));
            this.directions = [];
            this.slices = [];
            this.direction = 0;
            this.slice = dmin;
            this.nextSlice();
        }

        return this;
    }

    SliceShuffler.prototype.nextDirection = function() {
        if (this.directions.length === 0) {
            this.directions = util.range(8);
            util.shuffle(this.rng, this.directions);
        }
        this.direction = this.directions.pop();

        // initialize the slice array so that we're in a valid state.
        var dmin = 0, dmax = this.gridSize;
        if (this.direction%2 === 1) {
            dmin = this.minLen - 1;
            dmax = (this.gridSize * 2) - this.minLen;
        }
        this.slices = util.range(dmin, dmax);
        util.shuffle(this.rng, this.slices);
        this.slice = this.slices.pop();
        return this.direction;
    };

    SliceShuffler.prototype.nextSlice = function() {
        if (this.slices.length === 0) {
            this.nextDirection();
            // nextDirection has to pop the first new slice for us to maintain
            // a valid state, so we're ready to go.
        } else {
            this.slice = this.slices.pop();
        }
        return this.slice;
    };

    // ==================================================================

    // Accumulates stats (across multiple generation attempts if neccessary)
    function GenStatKeeper() {
        this.params = [];
        this.times = [];
        this.stats = { };
    }

    GenStatKeeper.prototype.startPuzzle = function(p, a, b) {
        this.params.push({
            size: p.size,
            seed: p.seed,
            a: a,
            b: b
        });
        this.startTime = new Date().getTime();
    };

    GenStatKeeper.prototype.finishPuzzle = function() {
        if (this.startTime) {
            this.times.push(new Date().getTime() - this.startTime);
        }
    };

    GenStatKeeper.prototype.add = function(k, v) {
        if (!Object.prototype.hasOwnProperty.call(this.stats, k)) {
            this.stats[k] = [];
        }
        this.stats[k].push(v);
    };

    GenStatKeeper.prototype.paramString = function(i) {
        var p = this.params[i];
        var s = '' + p.size + ' ' + p.seed + ' ' +
            ((typeof p.a === 'undefined')?'':p.a) + ' ' +
            ((typeof p.b === 'undefined')?'':p.b);
        return s;
    };

    GenStatKeeper.prototype.report = function() {
        var rpt = 'Tries: [' + this.params.length + '], ' +
            'Sum time: ['+ (this.times.reduce(function(a,b) { return a+b; }, 0)) +
            ']\n';
        rpt += '    Last run: ['+this.paramString(this.params.length-1)+']\n';

        rpt += '    Stats:\n';
        var that = this;
        var a = Object.keys(this.stats).sort().map(function(k) {
            return '        ' + k + ': ' + that.stats[k].length;
        });
        rpt += a.join('\n');

        util.log(rpt);
    };

    // ==================================================================

    function Generator(p) {
        this.puzzle = p;
        this.rng = Random.engines.mt19937();
        this.rng.seed(this.puzzle.seed);
        this.minWordLen = consts.MIN_MIN_WORDLEN;
        this.maxWordLen = Math.min(this.puzzle.size, consts.MAX_MAX_WORDLEN);
        this.shuffler = new SliceShuffler(this);
        this.tmpWordlists = {};
    }

    // make local copies of wordlists so we can prune as we go
    Generator.prototype.copyWordlists = function() {
        for (var i=this.minWordLen; i<=this.maxWordLen; i++) {
            var original = data.getWordlist(i);
            this.tmpWordlists[i] = original.slice();
        }
    };

    // ------------------------------------------------------------------
    // Puzzle analysis

    /*
     * Do an exhaustive search for duplicate or blacklisted words.
     */
    Generator.prototype.scanConflicts = function(fpick) {
        // when we find and fix bad words, we have to do another scan to make
        // sure we didn't replace them with other bad words.
        for (var rescans=0; rescans<=consts.MAX_CONFLICT_RETRIES; rescans++) {
            var conflicts = conflictscan.scan(this.puzzle, fpick);
            if (conflicts.length === 0) {
                return;
            }
            if (this.statKeeper) {
                this.statKeeper.add('conflictCheck', conflicts);
            }
        }
        if (this.statKeeper) {
            this.statKeeper.add('failureTooManyRetries', 1);
        }
        throw new conflictscan.PuzzleConflictError('Too many conflict retries');
    };


    // ------------------------------------------------------------------
    // Puzzle generation

    /*
     * Try to lay the given word into the rack string, working around existing characters.
     */
    Generator.prototype.fitWord = function(word, rack) {
        if (!word || !rack) {
            return -1;
        }
        var offsets = util.range(0, rack.length - word.length + 1);
        util.shuffle(this.rng, offsets);
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
    Generator.prototype.findFittingWord = function(rack, wordlen) {
        var tlen = rack.length;
        if (tlen < this.minWordLen) {
            util.log('findFittingWord: Bad rack ['+rack+']');
            return null;
        }
        if (wordlen > tlen) {
            util.log('findFittingWord: bad word length ['+wordlen+'] for ['+rack+']');
            return null;
        }

        var candidates = [];
        // ASSUMPTION: wordlist has been pre-stripped of blacklist words,
        // so we don't need to check against it while generating.
        for (var i=0; i<this.tmpWordlists[wordlen].length; i++) {
            var w = this.tmpWordlists[wordlen][i];
            var f = this.fitWord(w, rack);
            if (f !== -1) {
                candidates.push([w, f]);
            }
        }

        if (candidates.length === 0) {
            return null;
        }

        var pair = Random.pick(this.rng, candidates);
        return pair;
    };

    /*
     * Find a word that fits into this puzzle and add it.
     */
    Generator.prototype.generateWord = function(direction, slicei) {
        var rack = this.puzzle.grid.cutSlice(direction, slicei);
        // does this rack have a contiguous empty space large enough for a word
        // without excessive overlap? if not, we shouldn't bother trying to
        // cram a word into it.
        if (largestGap(rack) < this.minWordLen-1) {
            if (this.statKeeper) {
                this.statKeeper.add('rackNoGap', [direction, slicei, rack]);
            }
            return null;
        }

        // try fitting words of various lengths in random order.
        var wordlens = util.range(
            Math.min(this.minWordLen, rack.length),
            Math.min(this.maxWordLen, rack.length) + 1
        );
        util.shuffle(this.rng, wordlens);

        var i, w;
        for (i=0; i<wordlens.length; i++) {
            w = this.findFittingWord(rack, wordlens[i]);
            if (w) {
                break;
            }
        }

        if (w) {
            var gw = new grid.GridWord(this.puzzle.grid.size, w[0], direction, slicei, w[1]);
            this.puzzle.addAnswer(gw);

            // scrub the word out of the wordlist to avoid later duplicates or
            // overlaps. include substrings in the scrub.
            for (var len=this.minWordLen; len<=this.maxWordLen; len++) {
                var wl = this.tmpWordlists[len];
                for (i=wl.length-1; i>=0; i--) {
                    if ((len === w[0].length && wl[i] === w[0]) || // the word itself is in the list
                        (w[0].length < len && wl[i].lastIndexOf(w[0]) !== -1) ||
                        (len < w[0].length && w[0].lastIndexOf(wl[i]) !== -1)
                    ) {
                        this.tmpWordlists[len].splice(i, 1);
                    }
                }
            }

        } else if (this.statKeeper) {
            this.statKeeper.add('rackNoFit', [direction, slicei, rack]);
        }
        return w;
    };

    // ------------------------------------------------------------------
    // Main generator logic

    /*
     * Generate until the puzzle contains the given number of words.
     */
    Generator.prototype.generateByWordCount = function(nwords) {
        this.copyWordlists();

        for (var i=0; this.puzzle.answers.length<nwords && i<consts.MAX_CONFLICT_RETRIES; i++) {
            var j;
            for (j=0; this.puzzle.answers.length<nwords && j<this.shuffler.length; j++) {
                var direction = this.shuffler.direction,
                    slicei = this.shuffler.slice;
                var w = this.generateWord(direction, slicei);
                if (w) {
                    this.shuffler.nextDirection();
                } else {
                    this.shuffler.nextSlice();
                }
            }
            if (j >= this.shuffler.length) {
                if (this.statKeeper) {
                    this.statKeeper.add('sliceNoFit', j);
                }
            }
        }

        if (this.puzzle.answers.length < nwords) {
            if (this.statKeeper) {
                this.statKeeper.add('failureWordCount', this.puzzle.length.answers);
            }
            throw new conflictscan.PuzzleConflictError('Failed to generate enough words: ['+this.puzzle.answers.length+'] out of ['+nwords+']');
        }
    };

    /*
     * Generate words until the total density of the puzzle exceeds gd.
     * Pick longer or shorter words based on wlf.
     */
    Generator.prototype.generateByDensity = function(gd, wlf) {
        // scale min and max word lengths based on the given factor
        // 0 = only short words
        // .5 = any length
        // 1 = only long words
        wlf = parseFloat(wlf);
        if (!isNaN(wlf) && isFinite(wlf)) {
            wlf = util.clamp(wlf, 0, 1);
            var ceil = Math.min(this.puzzle.size, consts.MAX_MAX_WORDLEN);
            if (wlf < 0.5) {
                // lock min at floor, scale max
                this.minWordLen = 4;
                this.maxWordLen = Math.round(util.scale(wlf, 0.0, 0.5, this.minWordLen, ceil));
            } else {
                // lock max at ceiling, scale min
                this.maxWordLen = ceil;
                this.minWordLen = Math.round(util.scale(wlf, 0.5, 1.0, 4, ceil));
            }
        }
        this.copyWordlists();

        for (var i=0; this.puzzle.density()<=gd && i<consts.MAX_CONFLICT_RETRIES; i++) {
            var j;
            for (j=0; this.puzzle.density()<=gd && j<this.shuffler.length; j++) {
                var direction = this.shuffler.direction,
                    slicei = this.shuffler.slice;
                var w = this.generateWord(direction, slicei);
                if (w) {
                    this.shuffler.nextDirection();
                } else {
                    this.shuffler.nextSlice();
                }
            }
            if (j >= this.shuffler.length) {
                if (this.statKeeper) {
                    this.statKeeper.add('sliceNoFit', j);
                }
            }
        }

        if (this.puzzle.density() < gd) {
            if (this.statKeeper) {
                this.statKeeper.add('failureDensity', this.puzzle.density());
            }
            throw new conflictscan.PuzzleConflictError('Failed to generate enough density: ['+this.puzzle.density()+'] out of ['+gd+']');
        }
    };

    // ------------------------------------------------------------------
    // Main entry point

    /*
     * Turn my empty Puzzle object into a real puzzle!
     */
    Generator.prototype.generate = function(a, b) {
        if (this.statKeeper) {
            this.statKeeper.startPuzzle(this.puzzle, a, b);
        }
        try {

            if (a >= 0 && a <= 1) {
                this.generateByDensity(a, b);
            } else {
                this.generateByWordCount(a);
            }

            // only fill with letters that are in our words.
            var rr = this.rng;
            var glyphset = this.puzzle.words.reduce(function(s, t) {
                return s.concat(t.split(''));
            }, []);
            glyphset = d3.set(glyphset).values(); // uniq
            var fpick = function() {
                return Random.pick(rr, glyphset);
            };
            this.puzzle.grid.fillJunk(fpick);

            this.scanConflicts(fpick);
        } finally {
            if (this.statKeeper) {
                this.statKeeper.finishPuzzle();
            }
        }
    };

    // ------------------------------------------------------------------
    // Alternate entry point (for pre-generated words)

    /*
     * Find a place for the given word in the grid and make it an answer.
     */
    Generator.prototype.applyAnswer = function(word) {
        for (var i=0; i<this.shuffler.length; i++) {
            var direction = this.shuffler.direction,
                slicei = this.shuffler.slice;
            var rack = this.puzzle.grid.cutSlice(direction, slicei);
            var offset = this.fitWord(word, rack);
            if (offset === -1) {
                this.shuffler.nextSlice();
            } else {
                var gw = new grid.GridWord(this.puzzle.size, word, direction, slicei, offset);
                this.puzzle.addAnswer(gw);
                // prime the shuffler so that the next answer tries to go in a
                // different direction. parallel words should be a last resort.
                this.shuffler.nextDirection();
                return gw;
            }
        }
        if (this.statKeeper) {
            this.statKeeper.add('failureApply', word);
        }
        throw new conflictscan.PuzzleConflictError('applyAnswer: Couldn\'t fit ['+word+']!');
    };


    // ==================================================================

    module.exports = {
        SliceShuffler: SliceShuffler,
        GenStatKeeper: GenStatKeeper,
        Generator: Generator
    };
}());

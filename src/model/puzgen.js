(function () {
    'use strict';

    var Random = require('random-js');
    var consts = require('../consts');
    var util = require('../util');
    var data = require('./data');
    var grid = require('./grid');
    var conflictscan = require('./conflictscan');

    var thePuzzle, genstats, tmpWordlists;
    var minWordLen = consts.MIN_MIN_WORDLEN;
    var maxWordLen = consts.MAX_MAX_WORDLEN;

    // ==================================================================

    /*
     * Build array of slices to pick from
     */
    function shuffleSlices(rng, size) {
        var sa = [];
        for (var d=0; d<8; d++) {
            var a = 0, b = size;
            if (d%2 === 1) {
                a = minWordLen - 1;
                b = (size*2) - minWordLen;
            }
            for (var s=a; s<b; s++) {
                sa.push([d, s]);
            }
        }
        util.sloppyShuffle(rng, sa);
        return sa;
    }

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

    function generateInit() {
        genstats = {
            rackNoGap: [],
            rackNoFit: [],
            sliceNoFit: [],
            conflicts: [],
            failure: [],
            genTime: 0
        };
        tmpWordlists = {};
        // copy wordlists so we can prune as we go
        for (var i=minWordLen; i<=maxWordLen; i++) {
            var original = data.getWordlist(i);
            tmpWordlists[i] = original.slice();
        }
    }

    function generateTeardown() {
        tmpWordlists = {};
    }

    // ==================================================================
    // Puzzle analysis

    function scanConflicts() {
        // when we find and fix bad words, we have to do another scan to make
        // sure we didn't replace them with other bad words.
        for (var rescans=0; rescans<=consts.MAX_CONFLICT_RETRIES; rescans++) {
            var conflicts = conflictscan.scan(thePuzzle);
            if (conflicts.length === 0) {
                return;
            }
            if (thePuzzle.genstats) {
                thePuzzle.genstats.conflicts.push(conflicts);
            }
        }
        throw new conflictscan.PuzzleConflictError('Too many conflict retries');
    }

    function reportStats() {
        var totalletters = 0;
        for (var i=0; i<thePuzzle.words.length; i++) {
            totalletters += thePuzzle.words[i].length;
        }
        var maxletters = (thePuzzle.size * thePuzzle.size);
        var density = thePuzzle.density();
        var maxdensity = totalletters / maxletters * 100;
        util.log('[' + thePuzzle.answers.length + '] words, ' +
                 'density ' + density + '% ' +
                 '(out of possible ' + maxdensity + '%)');

        var s = '';
        var f = function(k) {
            s += k + ':' + genstats[k].length + ' ';
        };
        f('rackNoGap');
        f('rackNoFit');
        f('sliceNoFit');
        f('conflicts');
        f('failure');
        util.log(s);
        if (genstats.rackNoFit.length > 0) {
            util.log(genstats.rackNoFit);
        }
    }

    // ==================================================================
    // Puzzle generation

    /*
     * Try to lay the given word into the rack string, working around existing characters.
     */
    function fitWord(rng, word, rack) {
        if (!word || !rack) {
            return -1;
        }
        var offsets = util.range(0, rack.length - word.length + 1);
        util.sloppyShuffle(rng, offsets);
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
    }

    /*
     * find a word that fits into the rack string, working around any existing letters.
     */
    function findFittingWord(rack, wordlen) {
        var tlen = rack.length;
        if (tlen < minWordLen) {
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
        for (var i=0; i<tmpWordlists[wordlen].length; i++) {
            var w = tmpWordlists[wordlen][i];
            var f = fitWord(thePuzzle.rng, w, rack);
            if (f !== -1) {
                candidates.push([w, f]);
            }
        }

        if (candidates.length === 0) {
            return null;
        }

        var pair = Random.pick(thePuzzle.rng, candidates);
        //console.log(wordlen, tmpWordlists[wordlen].length, candidates.length, pair[0]);
        return pair;
    }

    /*
     * Find a word that fits into this puzzle and add it.
     */
    function generateWord(direction, slicei) {
        var rack = thePuzzle.grid.cutSlice(direction, slicei);
        // does this rack have a contiguous empty space large enough for a word
        // without excessive overlap? if not, we shouldn't bother trying to cram a word into it.
        if (largestGap(rack) < minWordLen-1) {
            genstats.rackNoGap.push([direction, slicei, rack]);
            return;
        }

        var wordlens = util.range(
            Math.min(minWordLen, rack.length),
            Math.min(maxWordLen, rack.length) + 1
        );
        util.sloppyShuffle(thePuzzle.rng, wordlens);

        var i, p;
        for (i=0; i<wordlens.length; i++) {
            p = findFittingWord(rack, wordlens[i]);
            if (p) {
                break;
            }
        }

        if (p) {
            var gw = new grid.GridWord(thePuzzle.grid.size, p[0], direction, slicei, p[1]);
            thePuzzle.addAnswer(gw);

            // scrub the word out of the wordlist to avoid later duplicates or overlaps.
            // include substrings in the scrub.
            for (var len=minWordLen; len<=maxWordLen; len++) {
                var wl = tmpWordlists[len];
                for (i=wl.length-1; i>=0; i--) {
                    if ((len === p[0].length && wl[i] === p[0]) || // the word itself is in the list
                        (p[0].length < len && wl[i].lastIndexOf(p[0]) !== -1) ||
                        (len < p[0].length && p[0].lastIndexOf(wl[i]) !== -1)
                    ) {
                        tmpWordlists[len].splice(i, 1);
                    }
                }
            }

        } else {
            genstats.rackNoFit.push([direction, slicei, rack]);
        }
    }

    function generateByWordCount(puz, nwords) {
        minWordLen = consts.MIN_MIN_WORDLEN;
        maxWordLen = Math.min(puz.size, consts.MAX_MAX_WORDLEN);
        generateInit();

        for (var i=0; thePuzzle.answers.length<nwords && i<consts.MAX_CONFLICT_RETRIES; i++) {
            var slices = shuffleSlices(thePuzzle.rng, thePuzzle.size);
            var j;
            for (j=0; thePuzzle.answers.length<nwords && j<slices.length; j++) {
                var direction = slices[j][0], slicei = slices[j][1];
                generateWord(direction, slicei);
            }
            if (j >= slices.length) {
                genstats.sliceNoFit.push(j);
                //util.log('generate: ran through all slices but didn\'t find room for a word.');
            }
        }

        if (thePuzzle.answers.length < nwords) {
            genstats.failure.push(thePuzzle.answers.length);
            throw new conflictscan.PuzzleConflictError('Failed to generate enough words');
        }
    }

    function generateByDensity(puz, gd, wlf) {
        // scale min and max word lengths based on the given factor
        if (typeof wlf !== 'undefined') {
            wlf = util.clamp(wlf, 0, 1);
            var ceil = Math.min(thePuzzle.size, consts.MAX_MAX_WORDLEN);
            if (wlf < 0.5) {
                // lock min at floor, scale max
                minWordLen = 4;
                maxWordLen = Math.round(util.scale(wlf, 0.0, 0.5, minWordLen, ceil));
            } else {
                // lock max at ceiling, scale min
                maxWordLen = ceil;
                minWordLen = Math.round(util.scale(wlf, 0.5, 1.0, 4, ceil));
            }
        }
        generateInit();

        for (var i=0; thePuzzle.density()<=gd && i<consts.MAX_CONFLICT_RETRIES; i++) {
            var slices = shuffleSlices(thePuzzle.rng, thePuzzle.size);
            var j;
            for (j=0; thePuzzle.density()<=gd && j<slices.length; j++) {
                var direction = slices[j][0], slicei = slices[j][1];
                generateWord(direction, slicei);
            }
            if (j >= slices.length) {
                genstats.sliceNoFit.push(j);
                //util.log('generate: ran through all slices but didn\'t find room for a word.');
            }
        }

        if (thePuzzle.density() < gd) {
            genstats.failure.push(thePuzzle.density());
            throw new conflictscan.PuzzleConflictError('Failed to generate enough density');
        }
    }

    // ==================================================================

    /*
     * Make a puzzle!
     */
    function generate(puzzle, a, b) {
        var t0 = new Date().getTime();
        thePuzzle = puzzle;

        if (a >= 0 && a <= 1) {
            generateByDensity(puzzle, a, b);
        } else {
            generateByWordCount(puzzle, a);
        }

        var rr = thePuzzle.rng;
        thePuzzle.grid.fillJunk(function(chars) {
            return Random.pick(rr, chars);
        });

        scanConflicts();
        generateTeardown();
        var t1 = new Date().getTime();
        genstats.genTime = t1 - t0;
        return genstats.genTime;
    }

    // ==================================================================

    /*
     * Find a place for the given word in the grid and make it an answer..
     */
    function makeAnswer(puzzle, word) {
        var sa = shuffleSlices(puzzle.rng, puzzle.size);
        for (var i=0; i<sa.length; i++) {
            var direction = sa[i][0], slicei = sa[i][1];
            var rack = puzzle.grid.cutSlice(direction, slicei);
            var offset = fitWord(puzzle.rng, word, rack);
            if (offset !== -1) {
                var gw = new grid.GridWord(puzzle.size, word, direction, slicei, offset);
                puzzle.addAnswer(gw);
                return gw;
            }
        }
        throw new conflictscan.PuzzleConflictError('makeAnswer: Couldn\'t fit ['+word+']!');
    }

    // ==================================================================

    module.exports = {
        makeAnswer: makeAnswer,
        fitWord: fitWord,
        generate: generate,
        reportStats: reportStats
    };

}());
